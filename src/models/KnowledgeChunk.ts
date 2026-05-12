import mongoose, { Schema, Document } from 'mongoose'

export interface IKnowledgeChunk extends Document {
  agentId: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  dataSourceId: mongoose.Types.ObjectId
  text: string
  embedding: number[]
  metadata?: Record<string, any>
  createdAt: Date
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  dataSourceId: { type: Schema.Types.ObjectId, ref: 'DataSource', required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } })

export default mongoose.models.KnowledgeChunk || mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema)
