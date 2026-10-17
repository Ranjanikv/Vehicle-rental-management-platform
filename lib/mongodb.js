import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Attach listeners once to auto-reset cached state if the connection drops or errors
if (!global._mongoListenersAttached) {
  global._mongoListenersAttached = true;
  mongoose.connection.on("disconnected", () => {
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.name || "Error");
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });
}

/**
 * Connect to MongoDB Atlas with connection caching, pooling, and bounded timeouts
 * suitable for Next.js hot-reloads and concurrent API requests.
 */
export default async function connectToDatabase() {
  const rawUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL;

  if (!rawUri || typeof rawUri !== "string" || !rawUri.trim()) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables. Please check .env.local"
    );
  }

  const uri = rawUri.trim().replace(/^['"]|['"]$/g, "");

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error(
      "Invalid MONGODB_URI scheme. Connection string must start with 'mongodb://' or 'mongodb+srv://'"
    );
  }

  // 1. If connection exists and is ready (1 = connected), reuse it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If a connection is actively in progress (2 = connecting), await existing promise
  if (mongoose.connection.readyState === 2 && cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // 3. If disconnected or uninitialized, start a new connection with bounded timeouts
  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5s timeout prevents requests from hanging for 30s
      connectTimeoutMS: 10000,        // 10s initial connection timeout
      socketTimeoutMS: 20000,         // 20s socket timeout prevents indefinite hangs
      maxPoolSize: 10,                // Maintain up to 10 sockets in pool
      minPoolSize: 1,                 // Keep at least 1 socket alive
      maxIdleTimeMS: 30000,           // Evict sockets idle for >30s
    };

    const attemptConnect = async (retriesLeft = 1) => {
      try {
        return await mongoose.connect(uri, opts);
      } catch (err) {
        if (retriesLeft > 0) {
          console.warn("MongoDB connection attempt failed. Retrying once in 500ms...");
          await new Promise((res) => setTimeout(res, 500));
          return await mongoose.connect(uri, opts);
        }
        throw err;
      }
    };

    cached.promise = attemptConnect();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}
