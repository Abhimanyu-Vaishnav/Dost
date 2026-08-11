export const runtime = "nodejs";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by normalized email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log(`[LOGIN FAILED] User not found for email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "Invalid credentials (User not found)" },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    let isPasswordValid = await bcrypt.compare(password, user.password);

    // Fallback for direct plain password comparison if seed used plain string
    if (!isPasswordValid && password === user.password) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      console.log(`[LOGIN FAILED] Invalid password for email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "Invalid credentials (Incorrect password)" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signToken({ userId: user.id, email: user.email });
    
    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json(
      { message: "Login successful", user: { id: user.id, email: user.email, name: user.name, username: user.username } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
