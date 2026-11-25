import { MongoClient } from 'mongodb';

// One shared connection, reused across requests (and across hot reloads in development).
// Returns null when MONGODB_URI isn't set, so the site still runs without a database.

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!globalThis._lookCloserMongo) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
    globalThis._lookCloserMongo = client.connect().catch((err) => {
      globalThis._lookCloserMongo = null; // try again on the next request
      throw err;
    });
  }
  const client = await globalThis._lookCloserMongo;
  return client.db(process.env.MONGODB_DB || 'lookcloser');
}
