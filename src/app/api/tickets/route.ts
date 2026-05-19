import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { auth } from '@/auth'
import { sendTicketEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/ratelimit'

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
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Rate Limiting (FIX 13): 5 tickets per 5 minutes per IP
    if (!checkRateLimit(ip, 5, 300000)) {
      return Response.json(
        { error: 'Too many requests.' },
        { status: 429, headers: { ...CORS, 'Retry-After': '300' } }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Malformed JSON body' },
        { status: 400, headers: CORS }
      )
    }

    const {
      agentId, sessionId, visitorName, visitorEmail,
      subject, description, conversationHistory
    } = body
    
    // Input Validation & Sanitization (FIX 12)
    if (!agentId || typeof agentId !== 'string' || !/^[a-f\d]{24}$/i.test(agentId)) {
      return Response.json(
        { error: 'Invalid or missing agent ID' },
        { status: 400, headers: CORS }
      )
    }

    if (!visitorEmail || typeof visitorEmail !== 'string') {
      return Response.json(
        { error: 'Missing visitor email' },
        { status: 400, headers: CORS }
      )
    }

    const email = visitorEmail.trim().toLowerCase()
    if (email.length > 200) {
      return Response.json(
        { error: 'Visitor email exceeds maximum length' },
        { status: 400, headers: CORS }
      )
    }

    // Email pattern check: Must contain @ and a dot after @
    const atIdx = email.indexOf('@')
    if (atIdx === -1 || email.indexOf('.', atIdx) === -1) {
      return Response.json(
        { error: 'Invalid visitor email format' },
        { status: 400, headers: CORS }
      )
    }

    if (!description || typeof description !== 'string') {
      return Response.json(
        { error: 'Missing description' },
        { status: 400, headers: CORS }
      )
    }

    const trimmedDesc = description.trim()
    if (trimmedDesc.length === 0) {
      return Response.json(
        { error: 'Description cannot be empty' },
        { status: 400, headers: CORS }
      )
    }

    if (trimmedDesc.length > 5000) {
      return Response.json(
        { error: 'Description exceeds maximum length of 5000 characters' },
        { status: 400, headers: CORS }
      )
    }
    
    const db = await connectDB()
    
    // Get agent to find owner and name safely (FIX 15)
    let agent
    try {
      agent = await db.collection('agents').findOne({ _id: new ObjectId(agentId) })
    } catch {
      return Response.json(
        { error: 'Invalid agent ID format' },
        { status: 400, headers: CORS }
      )
    }
    
    if (!agent) {
      return Response.json(
        { error: 'Agent not found' },
        { status: 404, headers: CORS }
      )
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
    
    // Create ticket record
    const ticket = {
      agentId,
      agentName: agent.name,
      sessionId: sessionId || 'unknown',
      visitorName: visitorName ? String(visitorName).trim().slice(0, 100) : 'Anonymous',
      visitorEmail: email,
      subject: subject ? String(subject).trim().slice(0, 200) : 'Support request',
      description: trimmedDesc,
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
        visitorEmail: email,
        subject: ticket.subject,
        description: trimmedDesc,
        ticketId: result.insertedId.toString()
      }).catch((e: any) => console.error('Email send failed:', e.message))
    } else {
      console.log('[Keli AI] No notification email could be resolved for agent:', agent.name)
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

// GET handler (for dashboard inbox and tickets page)
export async function GET(request: NextRequest) {
  // Auth required for this endpoint
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'all'
  const pageParam = searchParams.get('page')
  const limit = 20
  
  const db = await connectDB()
  const query: any = { ownerId: session.user.id }
  if (status !== 'all') {
    query.status = status
  }
  
  try {
    if (pageParam === null) {
      // Non-paginated request (original /tickets page)
      const tickets = await db.collection('tickets')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()
        
      return Response.json(tickets.map(t => ({
        ...t,
        _id: t._id.toString()
      })))
    }

    const page = parseInt(pageParam || '1')
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

