import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  slug: string
  ownerId: mongoose.Types.ObjectId
  plan: 'free' | 'premium'
  allowedDomains: string[]
  usage: {
    monthlyCredits: number
    creditsUsedThisMonth: number
    addonCredits: number
    resetDate: Date
  }
  limits: {
    maxAgents: number
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
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  allowedDomains: [{ type: String }],
  usage: {
    monthlyCredits: { type: Number, default: 500 }, // 500 free credits
    creditsUsedThisMonth: { type: Number, default: 0 },
    addonCredits: { type: Number, default: 0 },
    resetDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
  },
  limits: {
    maxAgents: { type: Number, default: 1 },
    maxStorage: { type: Number, default: 10 }
  },
  dodoSubscriptionId: { type: String },
  dodoCustomerId: { type: String },
}, { timestamps: true })

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
