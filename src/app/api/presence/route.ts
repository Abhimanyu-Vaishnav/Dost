export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { presenceManager } from "@/lib/presence/presence-manager";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userPayload = await getUserFromRequest(request);
  const searchParams = request.nextUrl.searchParams;

  const rawUserIds = searchParams.get("userIds");
  let userIds: string[] = [];

  if (rawUserIds) {
    userIds = rawUserIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  } else if (userPayload?.userId) {
    userIds = [userPayload.userId as string];
  }

  if (userIds.length === 0) {
    return NextResponse.json({ error: "No userIds provided" }, { status: 400 });
  }

  // Retrieve in-memory presence first
  const presenceMap = presenceManager.getMultiplePresence(userIds);

  // For users not found active in memory, check DB presence table / user table
  const missingIds = userIds.filter((id) => !presenceMap[id] || presenceMap[id].lastSeen.getTime() === 0);

  if (missingIds.length > 0) {
    const dbPresences = await prisma.userPresence.findMany({
      where: { userId: { in: missingIds } },
    });

    const dbUsers = await prisma.user.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, lastSeen: true },
    });

    const dbMap = new Map(dbPresences.map((p) => [p.userId, p]));
    const dbUserMap = new Map(dbUsers.map((u) => [u.id, u.lastSeen]));

    for (const id of missingIds) {
      const dbP = dbMap.get(id);
      const dbLastSeen = dbUserMap.get(id) || new Date();

      presenceMap[id] = {
        userId: id,
        isOnline: dbP?.isOnline ?? false,
        lastSeen: dbP?.lastSeen ?? dbLastSeen,
        typingConversationId: dbP?.typingConversationId ?? null,
      };
    }
  }

  return NextResponse.json({ presence: presenceMap });
}
