import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    await connectToDatabase();

    // Query user from MongoDB
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      kyc_status: user.kyc_status,
    };

    const token = signToken(userPayload);

    const response = Response.json({
      success: true,
      message: "Login successful",
      user: userPayload,
    });

    response.headers.append(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error.name || "Error");
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
