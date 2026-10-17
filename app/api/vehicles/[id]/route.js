import connectToDatabase from "@/lib/mongodb";
import Vehicle from "@/lib/models/Vehicle";
import Booking from "@/lib/models/Booking";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/vehicles/[id] - Get details for a single vehicle
export async function GET(req, { params }) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    const vehicle = await Vehicle.findById(id).lean();

    if (!vehicle) {
      return Response.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    const vId = vehicle._id.toString();

    return Response.json({
      success: true,
      vehicle: {
        id: vId,
        _id: vId,
        name: vehicle.name,
        type: vehicle.type,
        plate_no: vehicle.plate_no,
        price_per_day: vehicle.price_per_day,
        seats: vehicle.seats,
        fuel: vehicle.fuel,
        transmission: vehicle.transmission,
        image: vehicle.image,
        status: vehicle.status,
        odometer_km: vehicle.odometer_km,
        service_interval_km: vehicle.service_interval_km,
        last_service_km: vehicle.last_service_km,
        created_at: vehicle.created_at,
      },
    });
  } catch (error) {
    console.error("GET /api/vehicles/[id] error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to fetch vehicle details" },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id] - Admin API to update a vehicle
export async function PUT(req, { params }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    await connectToDatabase();

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type.trim();
    if (body.price_per_day !== undefined)
      updateData.price_per_day = parseFloat(body.price_per_day);
    if (body.seats !== undefined) updateData.seats = parseInt(body.seats);
    if (body.fuel !== undefined) updateData.fuel = body.fuel;
    if (body.transmission !== undefined)
      updateData.transmission = body.transmission;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.odometer_km !== undefined)
      updateData.odometer_km = parseInt(body.odometer_km);
    if (body.service_interval_km !== undefined)
      updateData.service_interval_km = parseInt(body.service_interval_km);
    if (body.last_service_km !== undefined)
      updateData.last_service_km = parseInt(body.last_service_km);

    if (body.plate_no !== undefined) {
      const trimmedPlate = body.plate_no.trim().toUpperCase();
      const duplicate = await Vehicle.findOne({
        plate_no: trimmedPlate,
        _id: { $ne: id },
      });
      if (duplicate) {
        return Response.json(
          {
            success: false,
            message: "A vehicle with this plate number already exists",
          },
          { status: 400 }
        );
      }
      updateData.plate_no = trimmedPlate;
    }

    const updated = await Vehicle.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return Response.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Vehicle updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/vehicles/[id] error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to update vehicle" },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Admin API to delete a vehicle safely
export async function DELETE(req, { params }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    await connectToDatabase();

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Check if vehicle has any associated active or past bookings
    const hasBookings = await Booking.exists({ vehicle_id: id });
    if (hasBookings) {
      return Response.json(
        {
          success: false,
          message:
            "Cannot delete vehicle because it has existing booking records. Consider marking it as MAINTENANCE instead.",
        },
        { status: 400 }
      );
    }

    const deleted = await Vehicle.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
