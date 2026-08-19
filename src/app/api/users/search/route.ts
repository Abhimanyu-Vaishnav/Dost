export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    const currentUserId = userPayload?.userId as string | undefined;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    const userSelect = {
      id: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
    };

    let users: any[] = [];

    if (query) {
      // Search by query (name or username)
      users = await prisma.user.findMany({
        where: {
          AND: [
            currentUserId ? { id: { not: currentUserId } } : {},
            {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: userSelect,
        take: 20,
      });
    } else if (currentUserId) {
      // If query is empty, load Followers + Following of the current user
      const followersRel = await prisma.follows.findMany({
        where: { followingId: currentUserId },
        include: { follower: { select: userSelect } },
      });

      const followingRel = await prisma.follows.findMany({
        where: { followerId: currentUserId },
        include: { following: { select: userSelect } },
      });

      const map = new Map<string, any>();
      followersRel.forEach((r) => map.set(r.follower.id, r.follower));
      followingRel.forEach((r) => map.set(r.following.id, r.following));

      users = Array.from(map.values());

      // If user has no followers/following yet, fallback to top user suggestions
      if (users.length === 0) {
        users = await prisma.user.findMany({
          where: { id: { not: currentUserId } },
          select: userSelect,
          take: 15,
          orderBy: { createdAt: "desc" },
        });
      }
    } else {
      // Unauthenticated fallback
      users = await prisma.user.findMany({
        select: userSelect,
        take: 15,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users/search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
