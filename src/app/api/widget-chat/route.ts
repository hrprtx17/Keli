import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Agent from '@/models/Agent'
import mongoose from 'mongoose'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, message, sessionId, history = [] } = body

    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!message || typeof message !== 'string' || message.length < 1 || message.length > 1000) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400, headers: CORS_HEADERS })
    }

    await connectDB()
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: CORS_HEADERS })
    }
    if (agent.isActive === false) {
      return NextResponse.json({ error: 'Agent is not active' }, { status: 403, headers: CORS_HEADERS })
    }

    // STEP 4 — RAG RETRIEVAL with Netlify Timeout Handling (6s)
    let context = ''
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 6000)

    try {
      const embedRes = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: message }),
          signal: abortController.signal
        }
      )
      clearTimeout(timeoutId)

      if (embedRes.ok) {
        const embedding = await embedRes.json()
        if (Array.isArray(embedding)) {
          const results = await mongoose.connection.db!.collection('knowledgechunks').aggregate([
            {
              $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector: embedding,
                numCandidates: 50,
                limit: 5,
                filter: { agentId: new mongoose.Types.ObjectId(agentId) }
              }
            },
            { $project: { text: 1, score: { $meta: "vectorSearchScore" } } }
          ]).toArray()
          context = results.map(r => r.text).join('\n\n---\n\n')
        }
      }
    } catch (err: any) {
      console.warn('RAG skipped: HuggingFace timed out or failed')
    }

    const systemPrompt = `
You are ${agent.name}, an AI support assistant.
Personality: ${agent.config?.tone || 'helpful, friendly, and concise'}
Role: ${agent.config?.role || 'customer support assistant'}

Knowledge base:
---
${context || 'No specific knowledge available. Answer generally.'}
---

Rules:
- Answer ONLY based on the knowledge provided above.
- If not in knowledge, say: "I don't have that information. Please contact our support team directly."
- Keep responses concise (2-4 sentences max).
`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10),
          { role: 'user', content: message }
        ],
        max_tokens: 500
      })
    })

    if (!groqRes.ok) throw new Error(`Groq API error: ${groqRes.statusText}`)

    // Log (fire and forget)
    mongoose.connection.db!.collection('conversations').insertOne({
      agentId: new mongoose.Types.ObjectId(agentId),
      sessionId,
      userMessage: message,
      timestamp: new Date(),
      agentName: agent.name,
      source: 'widget'
    }).catch(() => {})

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body?.getReader()
        if (!reader) return controller.close()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
              break
            }
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === 'data: [DONE]') continue
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6))
                  const token = data.choices[0]?.delta?.content || ''
                  if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
                } catch (e) {}
              }
            }
          }
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('Widget chat error:', error)
    // CRITICAL: Ensure CORS headers on error response
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' }, 
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
