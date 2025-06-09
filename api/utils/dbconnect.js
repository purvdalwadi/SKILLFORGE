// /api/utils/dbConnect.js
import mongoose from 'mongoose';

// Environment variable for MongoDB connection (MONGODB_URI)
// will be read directly from process.env inside the dbConnect function.

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  console.log("[MongoDB] Attempting connection...");
  
  if (!MONGODB_URI) {
    const errorMsg = "[MongoDB] Critical Error: MONGODB_URI is undefined. Ensure .env file is correct and loaded before db operations.";
    console.error(errorMsg);
    throw new Error(errorMsg); // Propagate error to stop connection attempt
  }

  if (cached.conn) {
    return cached.conn;
  }
  
  // Clear any previous promise if it failed
  if (cached.promise && cached.promise.isRejected) {
    cached.promise = null;
  }
  
  if (!cached.promise) {
    
    
    cached.promise = mongoose
      .connect(MONGODB_URI, { 
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        w: 'majority'
      })
      .then(mongooseInstance => {
        //console.log("[MongoDB] Connected");
        return mongooseInstance;
      })
      .catch(err => {
        console.error("[MongoDB] Connection error during mongoose.connect:", err);
        if (cached.promise) { // Check if promise exists before modifying
          cached.promise.isRejected = true;
        }
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