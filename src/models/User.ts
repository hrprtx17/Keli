import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  role: 'owner' | 'admin' | 'member'
  workspaceId?: mongoose.Types.ObjectId
  plan: 'free' | 'pro' | 'business'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'owner' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
