import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { checkRateLimit } from '@/lib/ratelimit'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function sanitizeMessage(msg: string): string {
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /you\s+are\s+now\s+(a\s+)?/gi,
    /act\s+as\s+(if\s+you\s+are|a)\s+/gi,
    /forget\s+(everything|all|your)\s+/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
  ]
  
  let cleaned = msg
  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, '[removed]')
  }
  return cleaned.slice(0, 2000)
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Rate Limiting
    if (!checkRateLimit(ip, 20, 60000)) {
      return Response.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': '60' } }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Malformed JSON body' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const { agentId, message, sessionId, history = [] } = body
    
    // Validate inputs
    if (!agentId || typeof agentId !== 'string' || !/^[a-f\d]{24}$/i.test(agentId)) {
      return Response.json(
        { error: 'Invalid or missing agentId' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Invalid or missing message' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const trimmedMsg = message.trim()
    if (trimmedMsg.length === 0) {
      return Response.json(
        { error: 'Message cannot be empty' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    if (trimmedMsg.length > 2000) {
      return Response.json(
        { error: 'Message exceeds maximum length' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const safeMessage = sanitizeMessage(trimmedMsg)
    
    // Load agent from DB
    const db = await connectDB()
    let agent
    try {
      agent = await db.collection('agents').findOne({ _id: new ObjectId(agentId) })
    } catch {
      return Response.json(
        { error: 'Invalid agent ID format' },
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
    
    // RAG: Fetch embeddings with strict 5s timeout fallback
    let context = ''
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      const embRes = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: safeMessage }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeout)
      
      if (embRes.ok) {
        const embedding = await embRes.json()
        if (Array.isArray(embedding) && embedding.length > 0) {
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
      console.log('[Keli AI] RAG skipped:', e.message)
    }
    
    // Construct System Prompt
    const systemPrompt = `You are ${agent.name || 'an AI assistant'}, a helpful support assistant.

${agent.systemPrompt || ''}

${context ? `Use this knowledge to answer:\n---\n${context}\n---\n` : ''}

Important rules:
- Be concise and helpful (2-4 sentences unless more detail is needed)
- If you cannot find the answer in the knowledge base, say: "I don't have that information. Please contact our support team for help."
- Never make up information
- Be warm, professional, and friendly
- Do not mention that you are using a knowledge base or that you are an AI unless asked`
    
    // Call Groq AI streaming API
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
          { role: 'user', content: safeMessage },
        ],
      }),
    })
    
    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('[Keli AI] Groq error:', err)
      return Response.json(
        { error: 'AI service unavailable' },
        { status: 502, headers: CORS_HEADERS }
      )
    }
    
    // Pipe Groq's SSE stream back to client
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
              const raw = trimmed.slice(6).trim()
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
        
        // Log conversation record in background
        db.collection('conversations').insertOne({
          agentId,
          sessionId: sessionId || 'unknown',
          userMessage: safeMessage,
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
    console.error('[Keli AI] widget-chat error:', error)
    return Response.json(
      { error: 'Server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
