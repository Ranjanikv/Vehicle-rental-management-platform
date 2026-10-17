import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "vehicle_rental_jwt_secret_key_2026";

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getAuthUser(req = null) {
  let token = null;

  if (req && req.cookies && typeof req.cookies.get === "function") {
    token = req.cookies.get("token")?.value;
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch (e) {
      // Ignore when outside Next request context
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(req = null) {
  const user = await getAuthUser(req);
  if (!user) {
    return { authorized: false, errorResponse: Response.json({ success: false, message: "Authentication required" }, { status: 401 }), user: null };
  }
  return { authorized: true, user, errorResponse: null };
}

export async function requireAdmin(req = null) {
  const { authorized, user, errorResponse } = await requireAuth(req);
  if (!authorized) return { authorized: false, errorResponse, user: null };

  if (user.role !== "ADMIN") {
    return {
      authorized: false,
      user: null,
      errorResponse: Response.json({ success: false, message: "Admin access required" }, { status: 403 })
    };
  }

  return { authorized: true, user, errorResponse: null };
}
