import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityLog extends Document {
  eventType: 'rate_limit' | 'auth_failure' | 'unauthorized_domain' | 'credit_exhausted' | 'bot_detected' | 'webhook_failure';
  ipAddress: string;
  userAgent?: string;
  endpoint: string;
  details?: string;
  workspaceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityLogSchema = new Schema<ISecurityLog>({
  eventType: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  endpoint: { type: String, required: true },
  details: { type: String },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
}, { timestamps: true });

SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
SecurityLogSchema.index({ ipAddress: 1, eventType: 1 });

export default mongoose.models.SecurityLog || mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
