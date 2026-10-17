import connectToDatabase from "@/lib/mongodb";
import Vehicle from "@/lib/models/Vehicle";
import Booking from "@/lib/models/Booking";
import { requireAdmin } from "@/lib/auth";

// GET /api/vehicles - Public API with search, filter, and date-based availability
export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const fuel = searchParams.get("fuel");
    const transmission = searchParams.get("transmission");
    const status = searchParams.get("status");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate") || searchParams.get("pickup");
    const endDate = searchParams.get("endDate") || searchParams.get("return");

    const hasDateRange = Boolean(
      startDate &&
        endDate &&
        !isNaN(new Date(startDate).getTime()) &&
        !isNaN(new Date(endDate).getTime())
    );

    // 1. Build Base Query Filter
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (fuel) {
      filter.fuel = fuel;
    }

    if (transmission) {
      filter.transmission = transmission;
    }

    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      filter.price_per_day = { $lte: parseFloat(maxPrice) };
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { plate_no: { $regex: term, $options: "i" } },
      ];
    }

    // 2. Date-based availability check against active/pending/confirmed bookings
    const conflictingVehicleIdSet = new Set();
    const conflictCountMap = new Map();

    if (hasDateRange) {
      const startUtc = new Date(startDate);
      const endUtc = new Date(endDate);

      // Overlap condition matching MySQL business rule:
      // Booking start_date <= requestedEndDate AND booking end_date >= requestedStartDate
      const overlappingBookings = await Booking.find(
        {
          status: { $in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          start_date: { $lte: endUtc },
          end_date: { $gte: startUtc },
        },
        { vehicle_id: 1 }
      ).lean();

      for (const b of overlappingBookings) {
        if (b.vehicle_id) {
          const vIdStr = b.vehicle_id.toString();
          conflictingVehicleIdSet.add(vIdStr);
          conflictCountMap.set(vIdStr, (conflictCountMap.get(vIdStr) || 0) + 1);
        }
      }
    }

    // 3. Status filter
    if (status) {
      if (status === "AVAILABLE" && hasDateRange) {
        filter.status = "AVAILABLE";
        if (conflictingVehicleIdSet.size > 0) {
          filter._id = { $nin: Array.from(conflictingVehicleIdSet) };
        }
      } else {
        filter.status = status;
      }
    }

    // 4. Query vehicles collection
    const vehicles = await Vehicle.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .lean();

    // 5. Format to exact frontend contract
    const formattedVehicles = vehicles.map((v) => {
      const vId = v._id.toString();
      const conflictCount = conflictCountMap.get(vId) || 0;
      let isAvailableForDates = false;

      if (hasDateRange) {
        isAvailableForDates = v.status === "AVAILABLE" && conflictCount === 0;
      } else {
        isAvailableForDates = v.status === "AVAILABLE";
      }

      return {
        id: vId,
        _id: vId,
        name: v.name,
        type: v.type,
        plate_no: v.plate_no,
        price_per_day: v.price_per_day,
        seats: v.seats,
        fuel: v.fuel,
        transmission: v.transmission,
        image: v.image,
        status: v.status,
        odometer_km: v.odometer_km,
        service_interval_km: v.service_interval_km,
        last_service_km: v.last_service_km,
        created_at: v.created_at,
        is_available_for_dates: Boolean(isAvailableForDates),
        conflict_count: Number(conflictCount),
      };
    });

    return Response.json({
      success: true,
      count: formattedVehicles.length,
      hasDateRange,
      selectedDates: hasDateRange ? { startDate, endDate } : null,
      vehicles: formattedVehicles,
    });
  } catch (error) {
    console.error("GET /api/vehicles error:", error.name || "Error", error.message);
    return Response.json(
      { success: false, message: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Admin API to add a new vehicle
export async function POST(req) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    await connectToDatabase();

    const body = await req.json();
    const {
      name,
      type,
      plate_no,
      price_per_day,
      seats,
      fuel,
      transmission,
      image,
      status,
      odometer_km,
      service_interval_km,
      last_service_km,
    } = body;

    if (!name || !type || !plate_no || !price_per_day) {
      return Response.json(
        {
          success: false,
          message: "Name, type, plate_no, and price_per_day are required",
        },
        { status: 400 }
      );
    }

    const trimmedPlate = plate_no.trim().toUpperCase();

    // Check unique plate_no
    const existing = await Vehicle.findOne({ plate_no: trimmedPlate });
    if (existing) {
      return Response.json(
        {
          success: false,
          message: "A vehicle with this plate number already exists",
        },
        { status: 400 }
      );
    }

    const newVehicle = await Vehicle.create({
      name: name.trim(),
      type: type.trim(),
      plate_no: trimmedPlate,
      price_per_day: parseFloat(price_per_day),
      seats: seats ? parseInt(seats) : 5,
      fuel: fuel || "Petrol",
      transmission: transmission || "Manual",
      image: image || "/images/vehicles/placeholder.jpg",
      status: status || "AVAILABLE",
      odometer_km: odometer_km ? parseInt(odometer_km) : 0,
      service_interval_km: service_interval_km
        ? parseInt(service_interval_km)
        : 10000,
      last_service_km: last_service_km ? parseInt(last_service_km) : 0,
    });

    return Response.json({
      success: true,
      message: "Vehicle added successfully",
      vehicleId: newVehicle._id.toString(),
    });
  } catch (error) {
    console.error("POST /api/vehicles error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to add vehicle" },
      { status: 500 }
    );
  }
}
