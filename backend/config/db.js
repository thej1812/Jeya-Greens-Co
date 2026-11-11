import mongoose from "mongoose"
import { config } from "./env.js"

export async function connectDB(uri = config.mongoUri) {
  mongoose.set("strictQuery", true)

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message)
  })
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected")
  })

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  })
  console.log(`MongoDB connected: ${connection.connection.host}`)
  return connection
}

export async function disconnectDB() {
  await mongoose.connection.close()
}
