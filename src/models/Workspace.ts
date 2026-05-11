import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  slug: string
  ownerId: mongoose.Types.ObjectId
  plan: 'free' | 'pro' | 'business'
  usage: {
    messagesThisMonth: number
    resetDate: Date
  }
  limits: {
    maxAgents: number
    maxMessages: number
    maxStorage: number
  }
  dodoSubscriptionId?: string
  dodoCustomerId?: string
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  usage: {
    messagesThisMonth: { type: Number, default: 0 },
    resetDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
  },
  limits: {
    maxAgents: { type: Number, default: 1 },
    maxMessages: { type: Number, default: 1000 },
    maxStorage: { type: Number, default: 10 }
  },
  dodoSubscriptionId: { type: String },
  dodoCustomerId: { type: String },
}, { timestamps: true })

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
