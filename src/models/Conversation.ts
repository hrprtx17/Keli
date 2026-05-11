import mongoose, { Schema, Document } from 'mongoose'

export interface IConversation extends Document {
  agentId: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  sessionId: string
  customerEmail?: string
  customerName?: string
  source: 'widget' | 'dashboard' | 'api'
  status: 'open' | 'resolved'
  messageCount: number
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  sessionId: { type: String, required: true },
  customerEmail: { type: String },
  customerName: { type: String },
  source: { type: String, enum: ['widget', 'dashboard', 'api'], default: 'widget' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  messageCount: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema)
