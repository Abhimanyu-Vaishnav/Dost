import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.user.update({
      where: { id: user.userId as string },
      data: { lastSeen: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ping error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
