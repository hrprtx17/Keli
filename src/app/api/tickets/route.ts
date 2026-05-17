import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { auth } from '@/auth'
import { sendTicketEmail } from '@/lib/email'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS })
}

// POST handler for creating tickets from widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agentId, sessionId, visitorName, visitorEmail,
      subject, description, conversationHistory
    } = body
    
    // Validate
    if (!agentId || !visitorEmail || !description) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400, headers: CORS }
      )
    }
    if (!visitorEmail.includes('@')) {
      return Response.json(
        { error: 'Invalid email' },
        { status: 400, headers: CORS }
      )
    }
    
    const db = await connectDB()
    
    // Get agent to find owner and name
    let agent
    try {
      agent = await db.collection('agents').findOne({ _id: new ObjectId(agentId) })
    } catch {
      return Response.json({ error: 'Invalid agent ID format' }, { status: 400, headers: CORS })
    }
    if (!agent) {
      return Response.json({ error: 'Agent not found' }, { status: 404, headers: CORS })
    }

    // Find the workspace owner to set as the ticket ownerId
    let ownerId = agent.userId?.toString() || agent.ownerId?.toString()
    let notificationEmail = agent.notificationEmail || agent.ownerEmail
    
    if (agent.workspaceId) {
      const workspace = await db.collection('workspaces').findOne({ _id: agent.workspaceId })
      if (workspace) {
        if (!ownerId && workspace.ownerId) {
          ownerId = workspace.ownerId.toString()
        }
        if (!notificationEmail && workspace.ownerId) {
          const ownerUser = await db.collection('users').findOne({ _id: workspace.ownerId })
          if (ownerUser) {
            notificationEmail = ownerUser.email
          }
        }
      }
    }
    
    // Create ticket
    const ticket = {
      agentId,
      agentName: agent.name,
      sessionId: sessionId || 'unknown',
      visitorName: visitorName || 'Anonymous',
      visitorEmail,
      subject: subject || 'Support request',
      description,
      conversationHistory: conversationHistory || [],
      status: 'open',
      priority: 'medium',
      ownerId: ownerId || 'unassigned',
      createdAt: new Date(),
      updatedAt: new Date(),
      agentNotes: ''
    }
    
    const result = await db.collection('tickets').insertOne(ticket)
    
    // Send email notification (fire and forget — never block the response)
    if (notificationEmail) {
      sendTicketEmail({
        to: notificationEmail,
        agentName: agent.name,
        visitorName: ticket.visitorName,
        visitorEmail,
        subject: ticket.subject,
        description,
        ticketId: result.insertedId.toString()
      }).catch((e: any) => console.error('Email send failed:', e.message))
    } else {
      console.log('[AgentDesk] No notification email could be resolved for agent:', agent.name)
    }
    
    return Response.json(
      { success: true, ticketId: result.insertedId.toString() },
      { headers: CORS }
    )
  } catch (error: any) {
    console.error('Ticket create POST error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS }
    )
  }
}

// GET handler (for dashboard inbox)
export async function GET(request: NextRequest) {
  // Auth required for this endpoint
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  
  const db = await connectDB()
  
  const query: any = { ownerId: session.user.id }
  if (status !== 'all') {
    query.status = status
  }
  
  try {
    const [tickets, total] = await Promise.all([
      db.collection('tickets')
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection('tickets').countDocuments(query)
    ])
    
    return Response.json({
      tickets: tickets.map(t => ({
        ...t,
        _id: t._id.toString()
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Ticket list GET error:', error)
    return Response.json({ error: 'Failed to retrieve tickets' }, { status: 500 })
  }
}
