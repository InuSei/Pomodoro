import mongoose from "mongoose";

// 5s server selection: an unreachable DB fails fast instead of hanging the page for the driver default 30s.
// Cache on globalThis so dev hot-reloads and warm serverless invocations reuse one connection.
const g = globalThis as typeof globalThis & { _mongoose?: Promise<typeof mongoose> };

export default function dbConnect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  g._mongoose ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 5000 }).catch((err) => {
    g._mongoose = undefined; // let the next request retry instead of caching the failure
    throw err;
  });
  return g._mongoose;
}
