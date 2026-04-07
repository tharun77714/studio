import { MongoClient, type Db } from 'mongodb';

const dbName = process.env.MONGODB_DB_NAME || 'sparkle_studio';

type GlobalMongo = typeof globalThis & {
  __sparkleMongoClient?: MongoClient;
  __sparkleMongoClientPromise?: Promise<MongoClient>;
};

const globalMongo = globalThis as GlobalMongo;

async function createClient() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  return client;
}

export async function getMongoClient() {
  if (globalMongo.__sparkleMongoClient) {
    return globalMongo.__sparkleMongoClient;
  }

  if (!globalMongo.__sparkleMongoClientPromise) {
    globalMongo.__sparkleMongoClientPromise = createClient();
  }

  globalMongo.__sparkleMongoClient = await globalMongo.__sparkleMongoClientPromise;
  return globalMongo.__sparkleMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
