import mongoose, { Schema, Document } from 'mongoose'

export interface IFAQ extends Document {
  agentId: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  question: string
  answer: string
  category?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const FAQSchema = new Schema<IFAQ>({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema)
