import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get IDs of users the current user is already following
    const following = await prisma.follows.findMany({
      where: { followerId: user.userId as string },
      select: { followingId: true },
    });
    
    const followingIds = following.map(f => f.followingId);
    
    // Add current user to exclude list
    followingIds.push(user.userId as string);

    // Fetch random users not in the exclude list and not the current user
    const suggestions = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: followingIds } },
          { id: { not: user.userId as string } }
        ]
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error("Fetch suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
