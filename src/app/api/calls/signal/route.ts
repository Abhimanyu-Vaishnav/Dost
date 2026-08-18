import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CALL_STATE_STORE, CallSessionData } from "@/lib/callEngine";

// POST /api/calls/signal - Universal Sub-100ms Call Signaling Router
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
    const { action, toUserId, callType, callerName, callerAvatar, sdp, candidate } = body;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    let existingSessionId = CALL_STATE_STORE.userSessionMap.get(currentUserId) || (currentUsername ? CALL_STATE_STORE.userSessionMap.get(currentUsername) : undefined);
    let session = existingSessionId ? CALL_STATE_STORE.sessions.get(existingSessionId) : undefined;

    if (action === "OFFER") {
      if (!toUserId) return NextResponse.json({ error: "Target required" }, { status: 400 });

      // Universal Recipient Lookup in Prisma DB
      const targetUser = await prisma.user.findFirst({
        where: { OR: [{ id: String(toUserId) }, { username: String(toUserId) }, { email: String(toUserId) }] },
        select: { id: true, username: true, name: true, avatar: true }
      });

      const targetGuid = targetUser?.id || String(toUserId);
      const targetUsername = targetUser?.username || String(toUserId);

      const sessionId = `call_${currentUserId}_${targetGuid}_${Date.now()}`;
      const newSession: CallSessionData = {
        sessionId,
        callerId: currentUserId,
        callerName: callerName || currentUsername || "User",
        callerAvatar: callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName || "User")}`,
        recipientId: targetGuid,
        recipientName: targetUser?.name || targetUsername,
        recipientAvatar: targetUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUsername)}`,
        callType: callType || "voice",
        status: "RINGING",
        updatedAt: Date.now(),
        callerCandidates: [],
        recipientCandidates: []
      };

      if (sdp) newSession.sdpOffer = sdp;

      CALL_STATE_STORE.sessions.set(sessionId, newSession);

      // Map ALL potential keys (GUID, username, raw target string) to session
      [currentUserId, currentUsername, targetGuid, targetUsername, String(toUserId)].forEach(k => {
        if (k) CALL_STATE_STORE.userSessionMap.set(k, sessionId);
      });

      return NextResponse.json({ success: true, session: newSession }, { status: 200 });
    }

    if (action === "SDP_OFFER" && session) {
      session.sdpOffer = sdp;
      session.updatedAt = Date.now();
      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "ANSWER" && session) {
      session.status = "CONNECTED";
      if (sdp) session.sdpAnswer = sdp;
      session.updatedAt = Date.now();
      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "SDP_ANSWER" && session) {
      session.sdpAnswer = sdp;
      session.updatedAt = Date.now();
      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "ICE_CANDIDATE" && session && candidate) {
      const isCaller = currentUserId === session.callerId || currentUsername === session.callerName;
      if (isCaller) {
        if (!session.callerCandidates) session.callerCandidates = [];
        session.callerCandidates.push(candidate);
      } else {
        if (!session.recipientCandidates) session.recipientCandidates = [];
        session.recipientCandidates.push(candidate);
      }
      session.updatedAt = Date.now();
      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if ((action === "REJECT" || action === "END") && session) {
      session.status = action === "REJECT" ? "REJECTED" : "ENDED";
      session.updatedAt = Date.now();

      [session.callerId, session.recipientId, session.callerName, session.recipientName].forEach(k => {
        if (k) CALL_STATE_STORE.userSessionMap.delete(k);
      });
      CALL_STATE_STORE.sessions.delete(session.sessionId);

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    return NextResponse.json({ success: true, session: session || null }, { status: 200 });
  } catch (error) {
    console.error("Call signaling error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/calls/signal - Universal Sub-100ms Recipient Polling
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(userPayload.userId);
    const currentUsername = typeof userPayload.username === "string" ? userPayload.username : "";

    // 1. First check direct map
    let sessionId = CALL_STATE_STORE.userSessionMap.get(currentUserId) || (currentUsername ? CALL_STATE_STORE.userSessionMap.get(currentUsername) : undefined);
    let session = sessionId ? CALL_STATE_STORE.sessions.get(sessionId) || null : null;

    // 2. Universal Scan: If direct map was missing, scan active sessions for recipient match!
    if (!session) {
      for (const sess of Array.from(CALL_STATE_STORE.sessions.values())) {
        const isRecipientMatch = sess.recipientId === currentUserId || 
                                sess.recipientName === currentUsername || 
                                sess.recipientId === currentUsername ||
                                (currentUsername && sess.recipientName?.toLowerCase() === currentUsername.toLowerCase());
        const isCallerMatch = sess.callerId === currentUserId || sess.callerName === currentUsername;

        if (isRecipientMatch || isCallerMatch) {
          session = sess;
          CALL_STATE_STORE.userSessionMap.set(currentUserId, sess.sessionId);
          if (currentUsername) CALL_STATE_STORE.userSessionMap.set(currentUsername, sess.sessionId);
          break;
        }
      }
    }

    if (session && Date.now() - session.updatedAt > 60000) {
      CALL_STATE_STORE.sessions.delete(session.sessionId);
      [session.callerId, session.recipientId, session.callerName, session.recipientName].forEach(k => {
        if (k) CALL_STATE_STORE.userSessionMap.delete(k);
      });
      return NextResponse.json({ session: null }, { status: 200 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Call signal GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
