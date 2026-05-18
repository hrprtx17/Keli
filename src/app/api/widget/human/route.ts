import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { sendHumanNotificationEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/ratelimit'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS })
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Rate Limiting: 3 human transfer requests per 5 minutes per IP
    if (!checkRateLimit(ip, 3, 300000)) {
      return Response.json(
        { error: 'Too many human handoff requests. Please wait a few minutes.' },
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

    const { agentId, visitorName, visitorEmail, message, conversationId } = body

    if (!agentId || typeof agentId !== 'string' || !/^[a-f\d]{24}$/i.test(agentId)) {
      return Response.json(
        { error: 'Invalid or missing agent ID' },
        { status: 400, headers: CORS }
      )
    }

    if (!visitorEmail || typeof visitorEmail !== 'string') {
      return Response.json(
        { error: 'Missing email address' },
        { status: 400, headers: CORS }
      )
    }

    const email = visitorEmail.trim().toLowerCase()
    const atIdx = email.indexOf('@')
    if (atIdx === -1 || email.indexOf('.', atIdx) === -1) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400, headers: CORS }
      )
    }

    const db = await connectDB()
    
    // Resolve agent details
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

    // Resolve owner notification email address
    let notificationEmail = agent.notificationEmail || agent.ownerEmail
    
    if (agent.workspaceId) {
      const workspace = await db.collection('workspaces').findOne({ _id: agent.workspaceId })
      if (workspace) {
        if (!notificationEmail && workspace.ownerId) {
          const ownerUser = await db.collection('users').findOne({ _id: workspace.ownerId })
          if (ownerUser) {
            notificationEmail = ownerUser.email
          }
        }
      }
    }

    if (notificationEmail) {
      await sendHumanNotificationEmail({
        to: notificationEmail,
        agentName: agent.name || 'AI Assistant',
        visitorName: visitorName ? String(visitorName).trim().slice(0, 100) : 'Anonymous Visitor',
        visitorEmail: email,
        message: message ? String(message).trim().slice(0, 2000) : 'Wants to talk to human support.',
        conversationId: conversationId || ''
      })
    } else {
      console.log('[AgentDesk] Talk to human alert skipped (no notification email resolved):', agent.name)
    }

    return Response.json(
      { success: true },
      { headers: CORS }
    )
  } catch (error: any) {
    console.error('Human handoff API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS }
    )
  }
}
