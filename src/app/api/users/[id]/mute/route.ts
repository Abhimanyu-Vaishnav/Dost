import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const mutedUserId = resolvedParams.id;
    const userId = user.userId as string;

    if (userId === mutedUserId) {
      return NextResponse.json({ error: "Cannot mute yourself" }, { status: 400 });
    }

    const existingMute = await prisma.mute.findUnique({
      where: { userId_mutedUserId: { userId, mutedUserId } },
    });

    if (existingMute) {
      await prisma.mute.delete({
        where: { userId_mutedUserId: { userId, mutedUserId } },
      });
      return NextResponse.json({ muted: false }, { status: 200 });
    } else {
      await prisma.mute.create({
        data: { userId, mutedUserId },
      });
      return NextResponse.json({ muted: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Mute error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
