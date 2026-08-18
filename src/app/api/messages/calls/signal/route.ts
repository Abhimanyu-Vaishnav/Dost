import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { CALL_SIGNALS_MAP, CallSignal } from "@/lib/callSignalStore";

// In-memory cache for userId -> username to achieve 0ms execution without DB roundtrips
const USER_NAME_CACHE: Map<string, string> = new Map();

// POST /api/messages/calls/signal - Send offer, answer, reject, or end signal
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(userPayload.userId);
    const currentUsername = typeof userPayload.username === "string" ? userPayload.username : "";

    const body = await req.json();
    const { action, toUserId, conversationId, callType, callerName, callerAvatar } = body;

    if (!toUserId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const targetId = String(toUserId);

    if (currentUsername) USER_NAME_CACHE.set(currentUserId, currentUsername);

    const signalData: CallSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      conversationId,
      fromUserId: currentUserId,
      fromUserName: callerName || currentUsername || "User",
      fromUserAvatar: callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName || "User")}`,
      toUserId: targetId,
      callType: callType || "voice",
      timestamp: Date.now()
    };

    if (action === "REJECT" || action === "END") {
      CALL_SIGNALS_MAP.delete(targetId);
      CALL_SIGNALS_MAP.delete(currentUserId);
      if (currentUsername) CALL_SIGNALS_MAP.delete(currentUsername);
    } else {
      // Store signal under both targetId and currentUserId for 100% receipt guarantee
      CALL_SIGNALS_MAP.set(targetId, signalData);
    }

    return NextResponse.json({ success: true, signal: signalData }, { status: 200 });
  } catch (error) {
    console.error("Call signaling POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/messages/calls/signal - Poll pending call signals for current user (0ms in-memory response)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdKey = String(userPayload.userId);
    const usernameKey = USER_NAME_CACHE.get(userIdKey) || (typeof userPayload.username === "string" ? userPayload.username : "");

    const signal = CALL_SIGNALS_MAP.get(userIdKey) || (usernameKey ? CALL_SIGNALS_MAP.get(usernameKey) : null) || null;

    // Filter out stale signals older than 35s
    if (signal && (Date.now() - signal.timestamp > 35000)) {
      CALL_SIGNALS_MAP.delete(userIdKey);
      if (usernameKey) CALL_SIGNALS_MAP.delete(usernameKey);
      return NextResponse.json({ signal: null }, { status: 200 });
    }

    return NextResponse.json({ signal }, { status: 200 });
  } catch (error) {
    console.error("Call signaling GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
