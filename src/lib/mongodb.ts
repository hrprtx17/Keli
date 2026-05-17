import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set')
}

declare global {
  var _mongoClient: Promise<MongoClient> | undefined
}

if (!global._mongoClient) {
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 8000,
  })
  global._mongoClient = client.connect()
}

export async function connectDB(): Promise<Db> {
  const client = await global._mongoClient!
  return client.db(process.env.MONGODB_DB_NAME || 'agentdesk')
}

export default global._mongoClient!
