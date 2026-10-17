import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import Vehicle from "@/lib/models/Vehicle";
import User from "@/lib/models/User";
import { getAuthUser } from "@/lib/auth";

// Helper for server-side double-booking check
export async function checkBookingConflict(vehicleId, startDate, endDate, excludeBookingId = null) {
  await connectToDatabase();
  const filter = {
    vehicle_id: new mongoose.Types.ObjectId(vehicleId),
    status: { $in: ["PENDING", "CONFIRMED", "ACTIVE"] },
    start_date: { $lte: new Date(endDate) },
    end_date: { $gte: new Date(startDate) },
  };

  if (excludeBookingId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  return await Booking.find(filter).lean();
}

// GET /api/bookings - Get bookings for logged-in user or all bookings for admin
export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const filter = {};
    if (authUser.role !== "ADMIN") {
      if (!mongoose.Types.ObjectId.isValid(authUser.id)) {
        return Response.json({ success: true, bookings: [] });
      }
      filter.customer_id = new mongoose.Types.ObjectId(authUser.id);
    }

    const bookings = await Booking.find(filter)
      .populate("vehicle_id", "name type plate_no price_per_day image")
      .populate("customer_id", "name email license_no")
      .sort({ created_at: -1, _id: -1 })
      .lean();

    const formattedBookings = bookings.map((b) => {
      const v = b.vehicle_id || {};
      const u = b.customer_id || {};
      const vId = v._id ? v._id.toString() : (b.vehicle_id ? b.vehicle_id.toString() : null);
      const uId = u._id ? u._id.toString() : (b.customer_id ? b.customer_id.toString() : null);

      return {
        id: b._id.toString(),
        customer_id: uId,
        vehicle_id: vId,
        start_date: b.start_date ? new Date(b.start_date).toISOString() : null,
        end_date: b.end_date ? new Date(b.end_date).toISOString() : null,
        status: b.status,
        agreement_signed: Boolean(b.agreement_signed),
        agreement_text: b.agreement_text || null,
        total_amount: Number(b.total_amount),
        pickup_odometer: b.pickup_odometer || null,
        return_odometer: b.return_odometer || null,
        created_at: b.created_at ? new Date(b.created_at).toISOString() : null,
        // Preserved flattened SQL aliases for frontend compatibility:
        vehicle_name: v.name || "Unknown Vehicle",
        vehicle_type: v.type || "N/A",
        plate_no: v.plate_no || "N/A",
        price_per_day: v.price_per_day ? Number(v.price_per_day) : 0,
        vehicle_image: v.image || "/images/vehicles/placeholder.jpg",
        customer_name: u.name || "Unknown Customer",
        customer_email: u.email || "N/A",
        license_no: u.license_no || "VERIFIED",
      };
    });

    return Response.json({
      success: true,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("GET /api/bookings error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking with Server-Side Double-Booking Prevention & Concurrency Mutex
export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(authUser.id)) {
      return Response.json(
        { success: false, message: "Invalid user account session." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Verify KYC status from MongoDB
    const user = await User.findById(authUser.id);
    if (!user) {
      return Response.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    if (user.kyc_status !== "VERIFIED") {
      return Response.json(
        {
          success: false,
          message: `KYC Verification Required. Your current KYC status is ${user.kyc_status}. Please upload your driving licence and await admin approval before booking.`,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const vehicleId = body.vehicleId || body.vehicle_id;
    const startDate = body.startDate || body.start_date;
    const endDate = body.endDate || body.end_date;

    if (!vehicleId || !startDate || !endDate) {
      return Response.json(
        { success: false, message: "vehicleId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return Response.json(
        { success: false, message: "Selected vehicle does not exist" },
        { status: 404 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return Response.json(
        { success: false, message: "Invalid start or end date format" },
        { status: 400 }
      );
    }

    if (start < today) {
      return Response.json(
        { success: false, message: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return Response.json(
        { success: false, message: "End date must be after start date" },
        { status: 400 }
      );
    }

    const diffTime = Math.abs(end - start);
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (numberOfDays <= 0) {
      return Response.json(
        { success: false, message: "Rental duration must be at least 1 day" },
        { status: 400 }
      );
    }

    // Fetch vehicle specs & verify operational availability
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return Response.json(
        { success: false, message: "Selected vehicle does not exist" },
        { status: 404 }
      );
    }

    if (vehicle.status === "MAINTENANCE") {
      return Response.json(
        { success: false, message: "Vehicle is currently under maintenance and cannot be rented." },
        { status: 400 }
      );
    }

    const pricePerDay = parseFloat(vehicle.price_per_day);
    const totalAmount = numberOfDays * pricePerDay;

    // Concurrency-safe reservation: Acquire write lock on Vehicle document inside a MongoDB transaction
    // with bounded retries for transient write-conflicts
    const maxRetries = 3;
    let attempt = 0;
    let createdBooking = null;

    while (attempt < maxRetries && !createdBooking) {
      attempt++;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // 1. Mutex: Acquire document write lock on the Vehicle to serialize concurrent booking attempts
          const lockedVehicle = await Vehicle.findOneAndUpdate(
            { _id: vehicle._id },
            { $inc: { __v: 1 } },
            { session, new: true }
          );

          if (!lockedVehicle) {
            throw new Error("Vehicle unavailable or modified");
          }

          // 2. Conflict query inside the locked transaction snapshot
          const conflict = await Booking.findOne({
            vehicle_id: vehicle._id,
            status: { $in: ["PENDING", "CONFIRMED", "ACTIVE"] },
            start_date: { $lte: end },
            end_date: { $gte: start },
          }).session(session);

          if (conflict) {
            const err = new Error("CONFLICT");
            err.isConflict = true;
            throw err;
          }

          // 3. Insert Booking within the transaction
          const [newDoc] = await Booking.create(
            [
              {
                customer_id: user._id,
                vehicle_id: vehicle._id,
                start_date: start,
                end_date: end,
                status: "PENDING",
                agreement_signed: false,
                total_amount: totalAmount,
              },
            ],
            { session }
          );

          createdBooking = newDoc;
        });

        break;
      } catch (txErr) {
        if (txErr.isConflict) {
          return Response.json(
            {
              success: false,
              message: "Vehicle is unavailable for the selected dates. A conflicting booking already exists.",
            },
            { status: 400 }
          );
        }

        const isTransient =
          typeof txErr.hasErrorLabel === "function" &&
          (txErr.hasErrorLabel("TransientTransactionError") ||
            txErr.hasErrorLabel("UnknownTransactionCommitResult"));

        if (isTransient && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 50 * attempt + Math.random() * 25));
          continue;
        }

        throw txErr;
      } finally {
        await session.endSession();
      }
    }

    if (!createdBooking) {
      return Response.json(
        { success: false, message: "Could not finalize reservation. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Booking created successfully. Please sign the rental agreement.",
      booking: {
        id: createdBooking._id.toString(),
        vehicleId: vehicle._id.toString(),
        vehicleName: vehicle.name,
        startDate,
        endDate,
        numberOfDays,
        pricePerDay,
        totalAmount,
        status: "PENDING",
        agreementSigned: false,
      },
    });
  } catch (error) {
    console.error("POST /api/bookings error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}
