import mongoose from "mongoose";

const MaintenanceLogSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
      index: true,
    },
    start_date: {
      type: Date,
      required: [true, "Maintenance start date is required"],
    },
    end_date: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"],
        message: "{VALUE} is not a valid maintenance status",
      },
      default: "SCHEDULED",
      index: true,
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
MaintenanceLogSchema.virtual("id").get(function () {
  return this._id ? this._id.toHexString() : null;
});

MaintenanceLogSchema.index({ vehicle_id: 1, status: 1 });

// Avoid re-compiling model in Next.js hot-reloads
export default mongoose.models.MaintenanceLog || mongoose.model("MaintenanceLog", MaintenanceLogSchema);
