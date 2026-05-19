import { MongoClient, Db } from 'mongodb'

declare global {
  var _mongoClient: Promise<MongoClient> | undefined
}

export async function connectDB(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  if (!global._mongoClient) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 8000,
    })
    global._mongoClient = client.connect()
  }

  const client = await global._mongoClient
  return client.db(process.env.MONGODB_DB_NAME || 'keli')
}

// Export a getter helper for default client if needed in legacy parts
export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }
  if (!global._mongoClient) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 8000,
    })
    global._mongoClient = client.connect()
  }
  return global._mongoClient
}
