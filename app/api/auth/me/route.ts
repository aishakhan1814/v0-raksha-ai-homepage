import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_rakshaai_jwt_key";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("raksha_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return NextResponse.json({
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          phone: decoded.phone,
          role: decoded.role,
          name: decoded.name
        }
      });
    } catch (jwtErr) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Authentication check failed" },
      { status: 500 }
    );
  }
}
