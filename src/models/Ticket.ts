import mongoose, { Schema, Document } from 'mongoose'

export interface ITicketReply {
  authorId?: mongoose.Types.ObjectId
  content: string
  createdAt: Date
}

export interface ITicket extends Document {
  workspaceId: mongoose.Types.ObjectId
  agentId?: mongoose.Types.ObjectId
  conversationId?: mongoose.Types.ObjectId
  title: string
  description: string
  customerEmail?: string
  customerName?: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: mongoose.Types.ObjectId
  replies: ITicketReply[]
  createdAt: Date
  updatedAt: Date
}

const TicketReplySchema = new Schema<ITicketReply>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

const TicketSchema = new Schema<ITicket>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  customerEmail: { type: String },
  customerName: { type: String },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  replies: [TicketReplySchema]
}, { timestamps: true })

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema)
