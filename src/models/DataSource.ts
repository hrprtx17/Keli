import mongoose, { Schema, Document } from 'mongoose'

export interface IDataSource extends Document {
  agentId: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  type: 'pdf' | 'docx' | 'txt' | 'csv' | 'md' | 'url' | 'text' | 'faq'
  name: string
  content: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  metadata: {
    size?: number
    pages?: number
    url?: string
    wordCount?: number
  }
  createdAt: Date
  updatedAt: Date
}

const DataSourceSchema = new Schema<IDataSource>({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  type: { type: String, enum: ['pdf', 'docx', 'txt', 'csv', 'md', 'url', 'text', 'faq'], required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'ready', 'error'], default: 'pending' },
  metadata: {
    size: { type: Number },
    pages: { type: Number },
    url: { type: String },
    wordCount: { type: Number }
  }
}, { timestamps: true })

export default mongoose.models.DataSource || mongoose.model<IDataSource>('DataSource', DataSourceSchema)
