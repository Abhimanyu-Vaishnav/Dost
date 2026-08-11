export const runtime = "nodejs";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name, username: requestedUsername } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Account already exists" },
        { status: 409 }
      );
    }

    // Determine unique username
    let finalUsername = requestedUsername
      ? requestedUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, "")
      : name.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

    if (!finalUsername) {
      finalUsername = `user_${Date.now()}`;
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: finalUsername },
    });

    if (existingUsername) {
      if (requestedUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      } else {
        finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username: finalUsername,
        password: hashedPassword,
        name,
      },
    });

    // Sign JWT
    const token = await signToken({ userId: user.id, email: user.email });
    
    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json(
      { message: "Registration successful", user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
