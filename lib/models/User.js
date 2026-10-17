import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: {
        values: ["CUSTOMER", "ADMIN"],
        message: "{VALUE} is not a valid role",
      },
      default: "CUSTOMER",
    },
    license_no: {
      type: String,
      trim: true,
      default: null,
      maxlength: 50,
    },
    license_image: {
      type: String,
      default: null,
      maxlength: 255,
    },
    license_name: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },
    license_dob: {
      type: Date,
      default: null,
    },
    license_valid_from: {
      type: Date,
      default: null,
    },
    license_valid_to: {
      type: Date,
      default: null,
    },
    kyc_status: {
      type: String,
      enum: {
        values: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
        message: "{VALUE} is not a valid KYC status",
      },
      default: "UNVERIFIED",
    },
    kyc_reason: {
      type: String,
      default: null,
      maxlength: 255,
    },
    kyc_verified_at: {
      type: Date,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Preserves exact created_at schema field from MySQL
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

// Virtual id getter for seamless frontend compatibility
UserSchema.virtual("id").get(function () {
  return this._id ? this._id.toHexString() : null;
});

// Avoid re-compiling model in Next.js hot-reloads
export default mongoose.models.User || mongoose.model("User", UserSchema);
