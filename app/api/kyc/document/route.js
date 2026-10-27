
import mongoose from "mongoose";
import { get } from "@vercel/blob";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);

    if (!authorized) {
      return errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return Response.json(
        { success: false, message: "Invalid customer ID." },
        { status: 400 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        { success: false, message: "Document storage is not configured." },
        { status: 500 }
      );
    }

    await connectToDatabase();

    const customer = await User.findById(userId).select("license_image");

    if (!customer || !customer.license_image) {
      return Response.json(
        { success: false, message: "Licence document not found." },
        { status: 404 }
      );
    }

    const pathname = customer.license_image;

    // Ensure this customer's document is stored under their own KYC prefix.
    if (!pathname.startsWith(`kyc/${customer._id}/`)) {
      return Response.json(
        { success: false, message: "Invalid document reference." },
        { status: 404 }
      );
    }

    const result = await get(pathname, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return Response.json(
        { success: false, message: "Licence document could not be retrieved." },
        { status: 404 }
      );
    }

    const contentType = result.blob.contentType;

    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        contentType
      )
    ) {
      return Response.json(
        { success: false, message: "Unsupported document type." },
        { status: 415 }
      );
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("[KYC DOCUMENT ERROR]", error);

    return Response.json(
      { success: false, message: "Unable to load licence document." },
      { status: 500 }
    );
  }
}
