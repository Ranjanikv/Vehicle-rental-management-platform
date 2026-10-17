import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { name, email, password, confirmPassword } = await req.json();

    if (!name || !email || !password) {
      return Response.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    await connectToDatabase();

    // Check if user already exists
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return Response.json(
        { success: false, message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user in MongoDB - strictly assign CUSTOMER role regardless of request body
    const newUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: "CUSTOMER",
      kyc_status: "UNVERIFIED",
    });

    const userPayload = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: "CUSTOMER",
      kyc_status: "UNVERIFIED",
    };

    const token = signToken(userPayload);

    const response = Response.json({
      success: true,
      message: "Account created successfully",
      user: userPayload,
    });

    response.headers.append(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );

    return response;
  } catch (error) {
    console.error("Signup error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
