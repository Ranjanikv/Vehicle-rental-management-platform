import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let user = null;
    if (authUser.id && mongoose.Types.ObjectId.isValid(authUser.id)) {
      user = await User.findById(authUser.id).lean();
    }
    if (!user && authUser.email) {
      user = await User.findOne({ email: authUser.email.toLowerCase() }).lean();
    }

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const formattedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      license_no: user.license_no || null,
      license_image: user.license_image || null,
      license_name: user.license_name || null,
      license_dob: user.license_dob ? new Date(user.license_dob).toISOString() : null,
      license_valid_from: user.license_valid_from ? new Date(user.license_valid_from).toISOString() : null,
      license_valid_to: user.license_valid_to ? new Date(user.license_valid_to).toISOString() : null,
      kyc_status: user.kyc_status,
      kyc_reason: user.kyc_reason || null,
      kyc_verified_at: user.kyc_verified_at ? new Date(user.kyc_verified_at).toISOString() : null,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
    };

    return Response.json({
      success: true,
      user: formattedUser,
    });
  } catch (error) {
    console.error("Auth me error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
