import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { auth } from '@/auth'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { ticketId } = await context.params
    const body = await request.json()
    const { status, priority, agentNotes } = body
    
    let ticketObjectId
    try {
      ticketObjectId = new ObjectId(ticketId)
    } catch {
      return Response.json({ error: 'Invalid ticket ID format' }, { status: 400 })
    }
    
    const db = await connectDB()
    
    const ticket = await db.collection('tickets')
      .findOne({ _id: ticketObjectId })
    
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }
    if (ticket.ownerId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const updates: any = { updatedAt: new Date() }
    if (status) {
      updates.status = status
      if (status === 'resolved') {
        updates.resolvedAt = new Date()
      }
    }
    if (priority) {
      updates.priority = priority
    }
    if (agentNotes !== undefined) {
      updates.agentNotes = agentNotes
    }
    
    await db.collection('tickets').updateOne(
      { _id: ticketObjectId },
      { $set: updates }
    )
    
    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Ticket update PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { ticketId } = await context.params
    let ticketObjectId
    try {
      ticketObjectId = new ObjectId(ticketId)
    } catch {
      return Response.json({ error: 'Invalid ticket ID format' }, { status: 400 })
    }
    
    const db = await connectDB()
    const ticket = await db.collection('tickets').findOne({ _id: ticketObjectId })
    
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }
    if (ticket.ownerId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    await db.collection('tickets').deleteOne({ _id: ticketObjectId })
    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Ticket delete error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
