import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database instance not available");
    }

    // Ping the MongoDB Atlas database to confirm active connectivity
    await db.admin().ping();

    return Response.json(
      {
        success: true,
        message: "MongoDB Atlas connected successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // Log server-side only for diagnostics without exposing sensitive connection details
    console.error("MongoDB Atlas connection error:", error.name || "ConnectionError");

    return Response.json(
      {
        success: false,
        message: "Failed to connect to MongoDB Atlas",
      },
      { status: 500 }
    );
  }
}
