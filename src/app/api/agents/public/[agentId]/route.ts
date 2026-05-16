import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Agent from '@/models/Agent'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400, headers: CORS_HEADERS })
    }

    await connectDB()
    const agent = await Agent.findById(agentId)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: CORS_HEADERS })
    }

    if (agent.isActive === false) {
      return NextResponse.json({ error: 'Agent not active' }, { status: 403, headers: CORS_HEADERS })
    }

    return NextResponse.json({
      name: agent.name,
      welcomeMessage: agent.widgetConfig?.welcomeMessage || "Hi! How can I help you today?",
      themeColor: agent.widgetConfig?.primaryColor || "#FF6B35",
      isActive: agent.isActive
    }, {
      headers: CORS_HEADERS
    })

  } catch (error) {
    console.error('Public agent fetch error:', error)
    // CRITICAL: Ensure CORS headers on error response
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
