import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId
  agentId: mongoose.Types.ObjectId
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: string
  escalated: boolean
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  intent: { type: String },
  escalated: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } })

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
