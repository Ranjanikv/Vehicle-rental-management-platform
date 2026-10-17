import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required"],
      index: true,
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
      index: true,
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },
    end_date: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"],
        message: "{VALUE} is not a valid booking status",
      },
      default: "PENDING",
      index: true,
    },
    agreement_signed: {
      type: Boolean,
      default: false,
    },
    agreement_text: {
      type: String,
      default: null,
    },
    total_amount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    pickup_odometer: {
      type: Number,
      default: null,
    },
    return_odometer: {
      type: Number,
      default: null,
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
BookingSchema.virtual("id").get(function () {
  return this._id ? this._id.toHexString() : null;
});

// Index for optimizing vehicle date availability and conflict lookup queries
// (Note: Concurrency-safe double-booking prevention requires a session transaction during insertion)
BookingSchema.index({ vehicle_id: 1, status: 1, start_date: 1, end_date: 1 });

// Index for customer reservations list and dashboard history
BookingSchema.index({ customer_id: 1, created_at: -1 });

// Avoid re-compiling model in Next.js hot-reloads
export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
