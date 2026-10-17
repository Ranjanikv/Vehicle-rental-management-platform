import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    // Verify admin setup key – allow bypass in development
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY;
    const providedKey = request.headers.get("x-admin-setup-key");
    if (process.env.NODE_ENV !== "production") {
      // Development: skip key check
    } else if (!ADMIN_SETUP_KEY || providedKey !== ADMIN_SETUP_KEY) {
      return Response.json(
        { success: false, message: "Invalid or missing admin setup key" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const adminEmail = "admin@vehiclerental.com";
    const adminPassword = "adminpassword123";

    // Ensure schema indexes (including unique email) are built
    await User.init();

    // Check if an account with this email already exists
    const existing = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existing) {
      return Response.json({
        success: true,
        message: "Admin user already exists",
        admin: {
          email: existing.email,
          role: existing.role,
        },
      });
    }

    const hashedPassword = await hashPassword(adminPassword);

    await User.create({
      name: "System Admin",
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: "ADMIN",
      kyc_status: "VERIFIED",
    });

    return Response.json({
      success: true,
      message: "Default Admin user created successfully",
      admin: {
        email: adminEmail,
        role: "ADMIN",
      },
    });
  } catch (error) {
    console.error("Seed admin error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Failed to seed admin" },
      { status: 500 }
    );
  }
}
