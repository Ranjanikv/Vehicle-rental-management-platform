import connectToDatabase from "@/lib/mongodb";
import Vehicle from "@/lib/models/Vehicle";

export async function POST() {
  try {
    await connectToDatabase();

    const initialVehicles = [
      {
        name: "Hyundai Creta",
        type: "SUV",
        plate_no: "KA-01-MJ-1024",
        price_per_day: 2500.0,
        seats: 5,
        fuel: "Petrol",
        transmission: "Automatic",
        image: "/images/vehicles/hyundai_creta.jpg",
        status: "AVAILABLE",
        odometer_km: 12500,
        service_interval_km: 10000,
        last_service_km: 10000,
      },
      {
        name: "Honda City",
        type: "Sedan",
        plate_no: "KA-05-AB-5678",
        price_per_day: 2000.0,
        seats: 5,
        fuel: "Petrol",
        transmission: "Manual",
        image: "/images/vehicles/honda_city.jpg",
        status: "AVAILABLE",
        odometer_km: 18400,
        service_interval_km: 10000,
        last_service_km: 15000,
      },
      {
        name: "Maruti Swift",
        type: "Hatchback",
        plate_no: "KA-03-XY-9012",
        price_per_day: 1200.0,
        seats: 5,
        fuel: "Petrol",
        transmission: "Manual",
        image: "/images/vehicles/maruti_swift.jpg",
        status: "AVAILABLE",
        odometer_km: 8200,
        service_interval_km: 10000,
        last_service_km: 5000,
      },
      {
        name: "Royal Enfield Himalayan",
        type: "Bike",
        plate_no: "KA-04-RE-4110",
        price_per_day: 1200.0,
        seats: 2,
        fuel: "Petrol",
        transmission: "Manual",
        image: "/images/vehicles/royal_enfield_himalayan.jpg",
        status: "AVAILABLE",
        odometer_km: 4500,
        service_interval_km: 5000,
        last_service_km: 3000,
      },
      {
        name: "Tata Nexon EV",
        type: "SUV",
        plate_no: "KA-02-EV-2024",
        price_per_day: 2800.0,
        seats: 5,
        fuel: "Electric",
        transmission: "Automatic",
        image: "/images/vehicles/tata_nexon_ev.jpg",
        status: "AVAILABLE",
        odometer_km: 14000,
        service_interval_km: 10000,
        last_service_km: 10000,
      },
    ];

    // Ensure schema indexes (including unique plate_no) are built
    await Vehicle.init();

    // Atomic upsert with $setOnInsert: inserts if missing, does NOT overwrite existing documents
    const operations = initialVehicles.map((vehicle) => ({
      updateOne: {
        filter: { plate_no: vehicle.plate_no },
        update: { $setOnInsert: vehicle },
        upsert: true,
      },
    }));

    const bulkResult = await Vehicle.bulkWrite(operations, { ordered: false });
    const newlyInsertedCount = bulkResult.upsertedCount || 0;
    const totalCount = await Vehicle.countDocuments();

    return Response.json({
      success: true,
      message:
        newlyInsertedCount > 0
          ? `Successfully seeded ${newlyInsertedCount} sample vehicles`
          : "All sample vehicles already exist in database",
      count: totalCount,
      seeded: newlyInsertedCount,
    });
  } catch (error) {
    console.error("Seed vehicles error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to seed vehicles" },
      { status: 500 }
    );
  }
}
