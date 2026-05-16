import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error('MONGODB_URI environment variable is not set')

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  })
  clientPromise = client.connect()
}

export async function connectDB(): Promise<Db> {
  const c = await clientPromise
  return c.db(process.env.MONGODB_DB_NAME || 'agentdesk')
}

export default clientPromise
