import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/customers - Admin list all customer KYC records
export async function GET(req) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    await connectToDatabase();

    const users = await User.find({})
      .sort({ created_at: -1, _id: -1 })
      .lean();

    const formattedCustomers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      license_no: u.license_no || null,
      license_image: u.license_image || null,
      license_name: u.license_name || null,
      license_dob: u.license_dob ? new Date(u.license_dob).toISOString() : null,
      license_valid_from: u.license_valid_from ? new Date(u.license_valid_from).toISOString() : null,
      license_valid_to: u.license_valid_to ? new Date(u.license_valid_to).toISOString() : null,
      kyc_status: u.kyc_status,
      kyc_reason: u.kyc_reason || null,
      kyc_verified_at: u.kyc_verified_at ? new Date(u.kyc_verified_at).toISOString() : null,
      created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
    }));

    return Response.json({
      success: true,
      customers: formattedCustomers,
    });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
