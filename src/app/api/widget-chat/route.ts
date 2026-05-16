import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, message, sessionId, history = [] } = body
    
    // Validate
    if (!agentId || !message || typeof message !== 'string') {
      return Response.json(
        { error: 'Missing agentId or message' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    if (message.length > 2000) {
      return Response.json(
        { error: 'Message too long' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    
    // Load agent
    const db = await connectDB()
    let agent
    try {
      agent = await db.collection('agents').findOne({ _id: new ObjectId(agentId) })
    } catch {
      return Response.json(
        { error: 'Invalid agent ID' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    
    if (!agent) {
      return Response.json(
        { error: 'Agent not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }
    if (!agent.isActive) {
      return Response.json(
        { error: 'Agent not active' },
        { status: 403, headers: CORS_HEADERS }
      )
    }
    
    // RAG: get embedding with 6s timeout
    let context = ''
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      
      const embRes = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: message }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeout)
      
      if (embRes.ok) {
        const embedding = await embRes.json()
        if (Array.isArray(embedding) && embedding.length > 0) {
          // Correct collection name and field mappings
          const chunks = await db.collection('knowledgechunks').aggregate([
            {
              $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: embedding,
                numCandidates: 50,
                limit: 5,
                filter: { agentId: new ObjectId(agentId) }
              }
            },
            { $project: { text: 1, _id: 0 } }
          ]).toArray()
          
          if (chunks.length > 0) {
            context = chunks.map((c: any) => c.text).join('\n\n---\n\n')
          }
        }
      }
    } catch (e: any) {
      // RAG failed - answer without context (Groq still responds)
      console.log('[AgentDesk] RAG skipped:', e.message)
    }
    
    // System prompt
    const systemPrompt = `You are ${agent.name || 'an AI assistant'}, a helpful support assistant.

${agent.systemPrompt || ''}

${context ? `Use this knowledge to answer:\n---\n${context}\n---\n` : ''}

Important rules:
- Be concise and helpful (2-4 sentences unless more detail is needed)
- If you cannot find the answer in the knowledge base, say: "I don't have that information. Please contact our support team for help."
- Never make up information
- Be warm, professional, and friendly
- Do not mention that you are using a knowledge base or that you are an AI unless asked`
    
    // Call Groq streaming
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        stream: true,
        max_tokens: 600,
        temperature: 0.6,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-8).map((h: any) => ({
            role: h.role,
            content: h.content,
          })),
          { role: 'user', content: message },
        ],
      }),
    })
    
    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('[AgentDesk] Groq error:', err)
      return Response.json(
        { error: 'AI service unavailable' },
        { status: 502, headers: CORS_HEADERS }
      )
    }
    
    // Stream SSE back to widget
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body!.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data: ')) continue
              const raw = trimmed.slice(6)
              if (raw === '[DONE]') {
                controller.enqueue(encoder.encode('data: {"done":true}\n\n'))
                continue
              }
              try {
                const parsed = JSON.parse(raw)
                const token = parsed.choices?.[0]?.delta?.content ?? ''
                if (token) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                  )
                }
              } catch { /* skip malformed line */ }
            }
          }
        } finally {
          controller.close()
        }
        
        // Log conversation async (never await this)
        db.collection('conversations').insertOne({
          agentId,
          sessionId: sessionId || 'unknown',
          userMessage: message,
          agentName: agent.name,
          timestamp: new Date(),
        }).catch(() => {})
      },
    })
    
    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
    
  } catch (error) {
    console.error('[AgentDesk] widget-chat error:', error)
    return Response.json(
      { error: 'Server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
