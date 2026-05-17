import mongoose, { Schema, Document } from 'mongoose'

export interface IAgent {
  workspaceId: mongoose.Types.ObjectId
  name: string
  description?: string
  avatar?: string
  systemPrompt?: string
  notificationEmail?: string
  model: string
  config: {
    temperature: number
    maxTokens: number
    language: string
    tone: string
    role: string
    guidelines: string[]
    linkUsage: 'normal' | 'high'
  }
  widgetConfig: {
    primaryColor: string
    position: 'bottom-right' | 'bottom-left'
    welcomeMessage: string
    placeholder: string
    showBranding: boolean
  }
  apiKey: string
  isActive: boolean
  totalConversations: number
  totalMessages: number
  createdAt: Date
  updatedAt: Date
}

const AgentSchema = new Schema<IAgent>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String },
  systemPrompt: { type: String },
  notificationEmail: { type: String },
  model: { type: String, default: 'llama-3.1-8b-instant' },
  config: {
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 500 },
    language: { type: String, default: 'auto' },
    tone: { type: String, default: 'professional' },
    role: { type: String, default: 'Helpful Assistant' },
    guidelines: { type: [String], default: [] },
    linkUsage: { type: String, enum: ['normal', 'high'], default: 'normal' }
  },
  widgetConfig: {
    primaryColor: { type: String, default: '#F97316' },
    position: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
    welcomeMessage: { type: String, default: 'Hello! How can I help you today?' },
    placeholder: { type: String, default: 'Type your message...' },
    showBranding: { type: Boolean, default: true }
  },
  apiKey: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  totalConversations: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema)
