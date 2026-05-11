import mongoose from 'mongoose';
import { connectDB } from './db';
import SecurityLog from '@/models/SecurityLog';

const RateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  tokens: { type: Number, required: true },
  resetAt: { type: Date, required: true },
});

RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);

export async function rateLimit(
  identifier: string, 
  limit: number, 
  windowMs: number,
  ipAddress: string,
  endpoint: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  await connectDB();
  
  const now = new Date();
  const resetDate = new Date(now.getTime() + windowMs);

  try {
    // Reset if expired or insert if new
    await RateLimit.updateOne(
      { key: identifier, $or: [{ resetAt: { $lte: now } }, { resetAt: { $exists: false } }] },
      { $set: { tokens: limit, resetAt: resetDate } },
      { upsert: true }
    );
  } catch (e) {
    // Ignore duplicate key errors on concurrent upserts
  }

  // Atomically decrement if tokens > 0
  const result = await RateLimit.findOneAndUpdate(
    { key: identifier, tokens: { $gt: 0 }, resetAt: { $gt: now } },
    { $inc: { tokens: -1 } },
    { new: true }
  );

  if (result) {
    return { success: true, limit, remaining: result.tokens, reset: result.resetAt };
  }

  const current = await RateLimit.findOne({ key: identifier });
  const remaining = Math.max(0, current?.tokens || 0);
  const reset = current?.resetAt || resetDate;

  if (remaining <= 0) {
    // Log abuse asynchronously
    SecurityLog.create({
      eventType: 'rate_limit',
      ipAddress,
      endpoint,
      details: `Exceeded limit of ${limit} per ${windowMs / 1000}s`
    }).catch(console.error);
  }

  return { success: false, limit, remaining, reset };
}
