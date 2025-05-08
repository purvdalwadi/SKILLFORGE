// /api/utils/dbConnect.js
import mongoose from 'mongoose';

// Use only environment variable for MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Using MongoDB URI:', MONGODB_URI ? 'URI is set' : 'URI is undefined');

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
    console.log("[MongoDB] Connecting...");
    
    cached.promise = mongoose
      .connect(MONGODB_URI, { 
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        w: 'majority'
      })
      .then(mongoose => {
        console.log("[MongoDB] Connected successfully");
        return mongoose;
      })
      .catch(err => {
        console.error("[MongoDB] Connection error:", err);
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