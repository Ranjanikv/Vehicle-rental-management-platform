import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import { getAuthUser } from "@/lib/auth";
import { generateAgreementPdf } from "@/lib/pdf";

export async function GET(req, { params }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    await connectToDatabase();

    const booking = await Booking.findById(id)
      .populate("vehicle_id", "name type plate_no price_per_day")
      .populate("customer_id", "name email license_no")
      .lean();

    if (!booking) {
      return Response.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const customerIdStr = booking.customer_id?._id
      ? booking.customer_id._id.toString()
      : booking.customer_id?.toString();

    // Security check: Only customer who owns the booking or Admin can access
    if (authUser.role !== "ADMIN" && customerIdStr !== authUser.id) {
      return Response.json(
        { success: false, message: "Unauthorized access to this booking agreement" },
        { status: 403 }
      );
    }

    // Unsigned agreements cannot be downloaded
    if (!booking.agreement_signed) {
      return Response.json(
        {
          success: false,
          message: "The rental agreement has not been signed yet. Please sign the agreement before downloading.",
        },
        { status: 400 }
      );
    }

    const v = booking.vehicle_id || {};
    const u = booking.customer_id || {};

    // Generate real PDF bytes
    const pdfBytes = await generateAgreementPdf({
      booking: {
        id: booking._id.toString(),
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_amount,
      },
      customer: {
        name: u.name || "Customer",
        email: u.email || "",
        license_no: u.license_no || "VERIFIED",
      },
      vehicle: {
        name: v.name || "Vehicle",
        type: v.type || "N/A",
        plate_no: v.plate_no || "N/A",
        price_per_day: v.price_per_day || 0,
      },
    });

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vehicle-rental-agreement-${booking._id.toString()}.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("GET /api/bookings/[id]/agreement/pdf error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to generate agreement PDF" },
      { status: 500 }
    );
  }
}
