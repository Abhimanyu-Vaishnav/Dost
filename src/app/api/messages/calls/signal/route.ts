import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_CALL_SESSIONS, USER_TO_SESSION_MAP, CallSession, setSessionForUserKeys } from "@/lib/callSignalStore";

// In-memory cache for userId -> username
const USER_NAME_CACHE: Map<string, string> = new Map();

// POST /api/messages/calls/signal - State Machine transitions (OFFER, ANSWER, REJECT, END)
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

    if (currentUsername) USER_NAME_CACHE.set(currentUserId, currentUsername);

    const body = await req.json();
    const { action, toUserId, callType, callerName, callerAvatar } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Lookup existing session for current user
    let existingSessionId = USER_TO_SESSION_MAP.get(currentUserId) || (currentUsername ? USER_TO_SESSION_MAP.get(currentUsername) : undefined);
    let session = existingSessionId ? ACTIVE_CALL_SESSIONS.get(existingSessionId) : undefined;

    if (action === "OFFER") {
      if (!toUserId) return NextResponse.json({ error: "Target required for offer" }, { status: 400 });

      // Resolve target user in Prisma DB
      const targetUser = await prisma.user.findFirst({
        where: { OR: [{ id: String(toUserId) }, { username: String(toUserId) }] },
        select: { id: true, username: true, name: true, avatar: true }
      });

      const targetGuid = targetUser?.id || String(toUserId);
      const targetUsername = targetUser?.username || String(toUserId);

      const sessionId = `call_${currentUserId}_${targetGuid}`;
      const newSession: CallSession = {
        sessionId,
        callerId: currentUserId,
        callerName: callerName || currentUsername || "User",
        callerAvatar: callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName || "User")}`,
        recipientId: targetGuid,
        recipientName: targetUser?.name || targetUsername,
        recipientAvatar: targetUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUsername)}`,
        callType: callType || "voice",
        status: "RINGING",
        updatedAt: Date.now()
      };

      ACTIVE_CALL_SESSIONS.set(sessionId, newSession);
      setSessionForUserKeys([currentUserId, currentUsername, targetGuid, targetUsername], newSession);
      return NextResponse.json({ success: true, session: newSession }, { status: 200 });
    }

    if (action === "ANSWER" && session) {
      session.status = "CONNECTED";
      session.updatedAt = Date.now();
      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if ((action === "REJECT" || action === "END") && session) {
      session.status = action === "REJECT" ? "REJECTED" : "ENDED";
      session.updatedAt = Date.now();
      
      // Cleanup session from maps
      const keysToClean = [session.callerId, session.recipientId];
      if (currentUsername) keysToClean.push(currentUsername);
      setSessionForUserKeys(keysToClean, null);
      ACTIVE_CALL_SESSIONS.delete(session.sessionId);

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    return NextResponse.json({ success: true, session: session || null }, { status: 200 });
  } catch (error) {
    console.error("Call signaling POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/messages/calls/signal - Poll active call session state (250ms high-frequency stream)
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

    const sessionId = USER_TO_SESSION_MAP.get(userIdKey) || (usernameKey ? USER_TO_SESSION_MAP.get(usernameKey) : undefined);
    const session = sessionId ? ACTIVE_CALL_SESSIONS.get(sessionId) || null : null;

    // Auto-cleanup stale sessions older than 45s
    if (session && (Date.now() - session.updatedAt > 45000)) {
      ACTIVE_CALL_SESSIONS.delete(session.sessionId);
      setSessionForUserKeys([session.callerId, session.recipientId, usernameKey], null);
      return NextResponse.json({ session: null }, { status: 200 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Call signaling GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
