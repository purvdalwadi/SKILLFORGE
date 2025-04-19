// /api/utils/dbConnect.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Parse connection string to get hostname for logging
let dbHost = 'unknown';
try {
  const uri = new URL(MONGODB_URI);
  dbHost = uri.hostname || 'unknown';
} catch (e) {
  console.error('Invalid MongoDB URI format');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  
  // Clear any previous promise if it failed
  if (cached.promise && cached.promise.isRejected) {
    cached.promise = null;
  }
  
  if (!cached.promise) {
    console.log(`[MongoDB] Connecting to ${dbHost}...`);
    
    cached.promise = mongoose
      .connect(MONGODB_URI, { 
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        heartbeatFrequencyMS: 30000,
        retryWrites: true,
        w: 'majority'
      })
      .then(mongoose => {
        console.log(`[MongoDB] Connected successfully to ${dbHost}`);
        return mongoose;
      })
      .catch(err => {
        console.error(`[MongoDB] Connection error: ${err.message}`);
        cached.promise.isRejected = true;
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${error.message}`);
    throw error;
  }
}

export default dbConnect;