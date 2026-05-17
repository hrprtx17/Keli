import { ObjectId } from 'mongodb'

export interface Ticket {
  _id: ObjectId
  agentId: string           // which agent this came from
  agentName: string         // agent's display name
  sessionId: string         // widget session
  
  // Visitor info
  visitorName: string       // from form or "Anonymous"
  visitorEmail: string      // required — to send reply
  
  // Ticket content
  subject: string           // auto-generated from last AI message
  description: string       // visitor's issue description
  conversationHistory: Array<{ role: string, content: string }>
  
  // Status
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  
  // Ownership
  ownerId: string           // userId of agent owner (to show in their inbox)
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  
  // Notes
  agentNotes?: string       // internal notes from the human agent
}
