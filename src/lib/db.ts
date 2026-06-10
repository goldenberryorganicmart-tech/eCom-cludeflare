import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global caching to prevent multiple connections during development hot-reloading
let cached = (global as any).mongo;

if (!cached) {
  cached = (global as any).mongo = { conn: null, promise: null, client: null };
}

async function connectToDatabase(): Promise<any> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const client = new MongoClient(MONGODB_URI as string);
    cached.promise = client.connect().then((connectedClient) => {
      console.log('Successfully connected to MongoDB via native driver.');
      cached.client = connectedClient;
      
      const db = connectedClient.db();
      
      // Shim startSession to support transactions on database client
      (db as any).startSession = async () => {
        try {
          const session = connectedClient.startSession();
          // Wrap session to gracefully handle environments without replica sets
          const originalStart = session.startTransaction.bind(session);
          session.startTransaction = function(options?: any) {
            try {
              originalStart(options);
            } catch (err: any) {
              console.warn('Transactions not supported in this environment (likely single-node local DB). Falling back to mock transaction.', err.message);
              // Mock transactional methods to prevent crash
              this.commitTransaction = async () => {};
              this.abortTransaction = async () => {};
            }
          };
          return session;
        } catch (e: any) {
          console.warn('Failed to start session, falling back to mock session:', e.message);
          return {
            startTransaction: () => {},
            commitTransaction: async () => {},
            abortTransaction: async () => {},
            endSession: async () => {}
          };
        }
      };

      return db;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
