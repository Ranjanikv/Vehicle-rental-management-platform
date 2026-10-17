import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";

// PUT /api/admin/customers/[id]/kyc - Approve or Reject Customer KYC
export async function PUT(req, { params }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { id } = await params;
    const { status, reason } = await req.json();

    const validStatuses = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"];
    if (!status || !validStatuses.includes(status)) {
      return Response.json(
        { success: false, message: "Invalid status provided. Allowed: UNVERIFIED, PENDING, VERIFIED, REJECTED" },
        { status: 400 }
      );
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    await connectToDatabase();

    const customer = await User.findById(id);
    if (!customer) {
      return Response.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    customer.kyc_status = status;
    customer.kyc_reason = status === "REJECTED" ? (reason || "Document requirements not met") : null;
    customer.kyc_verified_at = status === "VERIFIED" ? new Date() : null;

    await customer.save();

    return Response.json({
      success: true,
      message: `Customer KYC status updated to ${status}`,
    });
  } catch (error) {
    console.error("PUT /api/admin/customers/[id]/kyc error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to update KYC status" },
      { status: 500 }
    );
  }
}
