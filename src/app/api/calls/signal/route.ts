export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { presenceManager } from "@/lib/presence/presence-manager";

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, signalType, sdp, candidate, callType, callId, caller } = body;

    if (!targetUserId || !signalType) {
      return NextResponse.json({ error: "Missing targetUserId or signalType" }, { status: 400 });
    }

    presenceManager.sendToUser(targetUserId, {
      type: "call_signal",
      payload: {
        signalType, // "call_offer" | "call_answer" | "ice_candidate" | "call_end" | "call_reject" | "call_busy"
        senderId: userPayload.userId,
        targetUserId,
        callType: callType || "VOICE",
        callId,
        sdp,
        candidate,
        caller,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/calls/signal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
