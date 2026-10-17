import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import { getAuthUser } from "@/lib/auth";

export function generateRentalAgreementText(booking, customer, vehicle) {
  const startDate = new Date(booking.start_date).toLocaleDateString();
  const endDate = new Date(booking.end_date).toLocaleDateString();

  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  const diffTime = Math.abs(end - start);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  return `
===================================================================
                       RENTAL AGREEMENT
===================================================================
Booking Reference ID: BOOKING-#${booking.id}
Date Issued       : ${new Date().toLocaleDateString()}

1. PARTIES:
   - Vehicle Owner / Provider : RENT-EASE Vehicle Rental System
   - Customer Name           : ${customer.name}
   - Customer Email          : ${customer.email}
   - Driving Licence No.     : ${customer.license_no || "VERIFIED"}

2. VEHICLE DETAILS:
   - Vehicle Name            : ${vehicle.name}
   - Type                    : ${vehicle.type}
   - Registration Plate No.  : ${vehicle.plate_no}
   - Rate per Day            : ₹${parseFloat(vehicle.price_per_day).toLocaleString()}

3. RENTAL PERIOD & CHARGES:
   - Pick-up Date            : ${startDate}
   - Return Date             : ${endDate}
   - Duration                : ${days} Day(s)
   - Total Calculated Amount : ₹${parseFloat(booking.total_amount).toLocaleString()}

4. TERMS & CONDITIONS:
   a. The customer confirms that all details provided (including driving licence) are authentic and valid.
   b. The customer agrees to return the vehicle on or before the specified Return Date in the same condition as received.
   c. The customer accepts responsibility for any traffic violations or damages incurred during the rental period.
   d. Subleasing or unauthorized driver operation of the vehicle is strictly prohibited.

5. CONFIRMATION & SIGNATURE:
   By ticking the agreement checkbox and signing below, the customer acknowledges that they have read, understood, and agreed to all terms and conditions of this rental agreement.
===================================================================
`;
}

// GET /api/bookings/[id] - Get single booking details & generated agreement
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
      .populate("vehicle_id", "name type plate_no price_per_day image")
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

    // Security check: Only booking owner or Admin can view
    if (authUser.role !== "ADMIN" && customerIdStr !== authUser.id) {
      return Response.json(
        { success: false, message: "Unauthorized access to this booking" },
        { status: 403 }
      );
    }

    const v = booking.vehicle_id || {};
    const u = booking.customer_id || {};

    const formattedBooking = {
      id: booking._id.toString(),
      customer_id: customerIdStr,
      vehicle_id: v._id ? v._id.toString() : (booking.vehicle_id ? booking.vehicle_id.toString() : null),
      start_date: booking.start_date ? new Date(booking.start_date).toISOString() : null,
      end_date: booking.end_date ? new Date(booking.end_date).toISOString() : null,
      status: booking.status,
      agreement_signed: Boolean(booking.agreement_signed),
      agreement_text: booking.agreement_text || null,
      total_amount: Number(booking.total_amount),
      pickup_odometer: booking.pickup_odometer || null,
      return_odometer: booking.return_odometer || null,
      created_at: booking.created_at ? new Date(booking.created_at).toISOString() : null,
      vehicle_name: v.name || "Unknown Vehicle",
      vehicle_type: v.type || "N/A",
      plate_no: v.plate_no || "N/A",
      price_per_day: v.price_per_day ? Number(v.price_per_day) : 0,
      vehicle_image: v.image || "/images/vehicles/placeholder.jpg",
      customer_name: u.name || "Unknown Customer",
      customer_email: u.email || "N/A",
      license_no: u.license_no || "VERIFIED",
    };

    const agreementText =
      formattedBooking.agreement_text ||
      generateRentalAgreementText(
        formattedBooking,
        {
          name: formattedBooking.customer_name,
          email: formattedBooking.customer_email,
          license_no: formattedBooking.license_no,
        },
        {
          name: formattedBooking.vehicle_name,
          type: formattedBooking.vehicle_type,
          plate_no: formattedBooking.plate_no,
          price_per_day: formattedBooking.price_per_day,
        }
      );

    return Response.json({
      success: true,
      booking: formattedBooking,
      generatedAgreement: agreementText,
    });
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}
