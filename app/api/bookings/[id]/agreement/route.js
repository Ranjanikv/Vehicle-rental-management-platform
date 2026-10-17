import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import { getAuthUser } from "@/lib/auth";
import { generateRentalAgreementText } from "../route";

// POST /api/bookings/[id]/agreement - Sign rental agreement
export async function POST(req, { params }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const agreed = body.agreed || body.agreement_signed;

    if (!agreed) {
      return Response.json(
        { success: false, message: "You must accept the rental agreement terms before signing." },
        { status: 400 }
      );
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    await connectToDatabase();

    const booking = await Booking.findById(id)
      .populate("vehicle_id", "name type plate_no price_per_day")
      .populate("customer_id", "name email license_no");

    if (!booking) {
      return Response.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const customerIdStr = booking.customer_id?._id
      ? booking.customer_id._id.toString()
      : booking.customer_id?.toString();

    // Security check: Only customer who owns booking or Admin can sign agreement
    if (customerIdStr !== authUser.id && authUser.role !== "ADMIN") {
      return Response.json(
        { success: false, message: "Unauthorized to sign agreement for this booking" },
        { status: 403 }
      );
    }

    const v = booking.vehicle_id || {};
    const u = booking.customer_id || {};

    // Generate complete agreement text
    const agreementText = generateRentalAgreementText(
      {
        id: booking._id.toString(),
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_amount,
      },
      {
        name: u.name || "Customer",
        email: u.email || "",
        license_no: u.license_no || "VERIFIED",
      },
      {
        name: v.name || "Vehicle",
        type: v.type || "N/A",
        plate_no: v.plate_no || "N/A",
        price_per_day: v.price_per_day || 0,
      }
    );

    booking.agreement_signed = true;
    booking.agreement_text = agreementText;
    await booking.save();

    return Response.json({
      success: true,
      message: "Rental agreement signed successfully",
      agreementSigned: true,
      agreementText,
    });
  } catch (error) {
    console.error("POST /api/bookings/[id]/agreement error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to sign rental agreement" },
      { status: 500 }
    );
  }
}
