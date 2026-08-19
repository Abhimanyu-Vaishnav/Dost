export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { presenceManager } from "@/lib/presence/presence-manager";

export async function POST(request: NextRequest) {
  const userPayload = await getUserFromRequest(request);

  if (!userPayload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = userPayload.userId as string;

  // Record heartbeat in memory store (resets 45s offline countdown timer)
  const state = await presenceManager.recordHeartbeat(userId);

  return NextResponse.json({
    success: true,
    presence: {
      userId: state.userId,
      isOnline: state.isOnline,
      lastSeen: state.lastSeen.toISOString(),
    },
  });
}
