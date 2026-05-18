import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params
    
    // Validate agent ID format strictly
    if (!agentId || typeof agentId !== 'string' || !/^[a-f\d]{24}$/i.test(agentId)) {
      return Response.json(
        { error: 'Invalid or missing agent ID' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    
    let objectId
    try {
      objectId = new ObjectId(agentId)
    } catch {
      return Response.json(
        { error: 'Invalid agent ID format' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    
    const db = await connectDB()
    const agent = await db.collection('agents').findOne({ _id: objectId })
    
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
    
    // Protect private parameters (FIX 16) - return strictly only the required public fields
    return Response.json({
      name: agent.name || 'AI Assistant',
      welcomeMessage: agent.welcomeMessage || 'Hi! 👋 How can I help you today?',
      themeColor: agent.themeColor || '#FF6B35',
      isActive: true,
    }, { headers: CORS_HEADERS })
    
  } catch (error) {
    console.error('[AgentDesk] Public agent API error:', error)
    return Response.json(
      { error: 'Server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
