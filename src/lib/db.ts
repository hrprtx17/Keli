import mongoose from 'mongoose'

declare global {
  var mongoose: any
}

const MONGODB_URI = process.env.MONGODB_URI!

let cached = global.mongoose || { conn: null, promise: null }

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    })
  }
  cached.conn = await cached.promise
  global.mongoose = cached
  return cached.conn
}
