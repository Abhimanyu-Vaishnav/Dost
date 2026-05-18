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
    const blockedUserId = resolvedParams.id;
    const userId = user.userId as string;

    if (userId === blockedUserId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const existingBlock = await prisma.block.findUnique({
      where: { userId_blockedUserId: { userId, blockedUserId } },
    });

    if (existingBlock) {
      await prisma.block.delete({
        where: { userId_blockedUserId: { userId, blockedUserId } },
      });
      return NextResponse.json({ blocked: false }, { status: 200 });
    } else {
      await prisma.block.create({
        data: { userId, blockedUserId },
      });
      // Also unfollow if blocked
      try {
        await prisma.follows.deleteMany({
          where: {
            OR: [
              { followerId: userId, followingId: blockedUserId },
              { followerId: blockedUserId, followingId: userId }
            ]
          }
        });
      } catch (e) {}
      
      return NextResponse.json({ blocked: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Block error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
