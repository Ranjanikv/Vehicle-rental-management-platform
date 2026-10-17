import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";

// PUT /api/kyc/details - Customer manual review & correction of licence details
export async function PUT(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      license_no,
      license_name,
      license_dob,
      license_valid_from,
      license_valid_to
    } = body;

    const trimmedNo = license_no ? String(license_no).trim().toUpperCase() : null;
    const trimmedName = license_name ? String(license_name).trim() : authUser.name;
    const dob = license_dob ? String(license_dob).trim() : null;
    const validFrom = license_valid_from ? String(license_valid_from).trim() : null;
    const validTo = license_valid_to ? String(license_valid_to).trim() : null;

    if (!trimmedNo) {
      return Response.json(
        { success: false, message: "Driving licence number is required." },
        { status: 400 }
      );
    }

    // Date Validations
    if (validFrom && validTo) {
      if (validFrom === validTo) {
        return Response.json(
          {
            success: false,
            message: "Licence issue date (Valid From) and expiry date (Valid To) cannot be identical."
          },
          { status: 400 }
        );
      }

      const fromTime = new Date(validFrom).getTime();
      const toTime = new Date(validTo).getTime();

      if (isNaN(fromTime) || isNaN(toTime)) {
        return Response.json(
          { success: false, message: "Invalid date format for issue or expiry date." },
          { status: 400 }
        );
      }

      if (toTime <= fromTime) {
        return Response.json(
          {
            success: false,
            message: "Licence expiry date (Valid To) must be strictly after the issue date (Valid From)."
          },
          { status: 400 }
        );
      }
    }

    if (dob) {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return Response.json(
          { success: false, message: "Invalid date of birth format." },
          { status: 400 }
        );
      }

      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return Response.json(
          { success: false, message: "Driving licence holder must be at least 18 years of age." },
          { status: 400 }
        );
      }

      if (validFrom) {
        const fromTime = new Date(validFrom).getTime();
        if (fromTime <= dobDate.getTime()) {
          return Response.json(
            { success: false, message: "Licence issue date must be after the date of birth." },
            { status: 400 }
          );
        }
      }
    }

    await connectToDatabase();

    const updateFields = {
      license_no: trimmedNo,
      license_name: trimmedName,
      license_dob: dob ? new Date(dob) : null,
      license_valid_from: validFrom ? new Date(validFrom) : null,
      license_valid_to: validTo ? new Date(validTo) : null,
      kyc_status: "PENDING",
      kyc_reason: null,
    };

    let user = null;
    if (authUser.id && mongoose.Types.ObjectId.isValid(authUser.id)) {
      user = await User.findByIdAndUpdate(authUser.id, updateFields, { new: true });
    }
    if (!user && authUser.email) {
      user = await User.findOneAndUpdate(
        { email: authUser.email.toLowerCase() },
        updateFields,
        { new: true }
      );
    }

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Licence details successfully saved and updated for admin verification.",
      details: {
        license_no: trimmedNo,
        license_name: trimmedName,
        license_dob: dob,
        license_valid_from: validFrom,
        license_valid_to: validTo,
        kyc_status: "PENDING"
      }
    });
  } catch (error) {
    console.error("PUT /api/kyc/details error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to update licence details" },
      { status: 500 }
    );
  }
}
