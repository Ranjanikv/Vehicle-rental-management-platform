import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: {
        values: ["SUV", "Sedan", "Hatchback", "Bike"],
        message: "{VALUE} is not a valid vehicle type",
      },
      trim: true,
    },
    plate_no: {
      type: String,
      required: [true, "Plate number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
      index: true,
    },
    price_per_day: {
      type: Number,
      required: [true, "Daily rental rate is required"],
      min: [0, "Price per day cannot be negative"],
    },
    seats: {
      type: Number,
      default: 5,
      min: [1, "Seats must be at least 1"],
      max: [20, "Seats cannot exceed 20"],
    },
    fuel: {
      type: String,
      enum: {
        values: ["Petrol", "Diesel", "Electric", "Hybrid"],
        message: "{VALUE} is not a supported fuel type",
      },
      default: "Petrol",
    },
    transmission: {
      type: String,
      enum: {
        values: ["Manual", "Automatic"],
        message: "{VALUE} is not a valid transmission type",
      },
      default: "Manual",
    },
    image: {
      type: String,
      default: "/images/vehicles/placeholder.jpg",
      maxlength: 255,
    },
    status: {
      type: String,
      enum: {
        values: ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE"],
        message: "{VALUE} is not a valid status",
      },
      default: "AVAILABLE",
      index: true,
    },
    odometer_km: {
      type: Number,
      default: 0,
      min: 0,
    },
    service_interval_km: {
      type: Number,
      default: 10000,
      min: 0,
    },
    last_service_km: {
      type: Number,
      default: 0,
      min: 0,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Virtual id getter
VehicleSchema.virtual("id").get(function () {
  return this._id ? this._id.toHexString() : null;
});

// Avoid re-compiling model in Next.js hot-reloads
export default mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);
