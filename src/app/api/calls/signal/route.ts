import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CALL_STATE_STORE, CallSessionData, pushSSEEventToUser } from "@/lib/callEngine";

// POST /api/calls/signal - Ultra-Low Latency Sub-10ms Instant SSE Signal Push Router
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(userPayload.userId);
    const currentUsername = typeof userPayload.username === "string" ? userPayload.username.replace("@", "") : "";
    const body = await req.json();
    const { action, toUserId, callType, callerName, callerAvatar, sdp, candidate } = body;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    // Handle END or REJECT Action
    if (action === "REJECT" || action === "END") {
      let targetSession: CallSessionData | undefined = undefined;

      const existingSessionId = CALL_STATE_STORE.userSessionMap.get(currentUserId) || 
                               (currentUsername ? CALL_STATE_STORE.userSessionMap.get(currentUsername) : undefined);
      if (existingSessionId) {
        targetSession = CALL_STATE_STORE.sessions.get(existingSessionId);
      }

      if (!targetSession) {
        for (const sess of Array.from(CALL_STATE_STORE.sessions.values())) {
          const isMatch = sess.callerId === currentUserId || 
                          sess.recipientId === currentUserId ||
                          sess.callerName?.replace("@", "").toLowerCase() === currentUsername.toLowerCase() ||
                          sess.recipientName?.replace("@", "").toLowerCase() === currentUsername.toLowerCase();
          if (isMatch) {
            targetSession = sess;
            break;
          }
        }
      }

      if (targetSession) {
        targetSession.status = action === "REJECT" ? "REJECTED" : "ENDED";
        targetSession.updatedAt = Date.now();

        // Push termination event instantly to both peers via SSE
        if (targetSession.callerId) pushSSEEventToUser(targetSession.callerId, { type: "CALL_SIGNAL", session: targetSession });
        if (targetSession.callerName) pushSSEEventToUser(targetSession.callerName, { type: "CALL_SIGNAL", session: targetSession });
        if (targetSession.recipientId) pushSSEEventToUser(targetSession.recipientId, { type: "CALL_SIGNAL", session: targetSession });
        if (targetSession.recipientName) pushSSEEventToUser(targetSession.recipientName, { type: "CALL_SIGNAL", session: targetSession });

        // Purge session from maps
        Array.from(CALL_STATE_STORE.userSessionMap.entries()).forEach(([k, v]) => {
          if (v === targetSession!.sessionId) {
            CALL_STATE_STORE.userSessionMap.delete(k);
          }
        });
        CALL_STATE_STORE.sessions.delete(targetSession.sessionId);

        return NextResponse.json({ success: true, session: targetSession }, { status: 200 });
      }

      return NextResponse.json({ success: true, session: null }, { status: 200 });
    }

    let existingSessionId = CALL_STATE_STORE.userSessionMap.get(currentUserId) || 
                           (currentUsername ? CALL_STATE_STORE.userSessionMap.get(currentUsername) : undefined);
    let session = existingSessionId ? CALL_STATE_STORE.sessions.get(existingSessionId) : undefined;

    // Handle New Call OFFER Signal
    if (action === "OFFER") {
      if (!toUserId) return NextResponse.json({ error: "Target required" }, { status: 400 });

      const rawTarget = String(toUserId);
      const cleanTarget = rawTarget.replace("@", "").trim();

      // Recipient DB Lookup
      const targetUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { id: rawTarget },
            { id: cleanTarget },
            { username: cleanTarget },
            { username: rawTarget },
            { email: cleanTarget }
          ] 
        },
        select: { id: true, username: true, name: true, avatar: true }
      });

      const targetGuid = targetUser?.id || cleanTarget;
      const targetUsername = targetUser?.username ? targetUser.username.replace("@", "") : cleanTarget;
      const targetDisplayName = targetUser?.name || targetUsername;
      const targetAvatarUrl = targetUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetDisplayName)}&background=00f2fe&color=ffffff`;

      const sessionId = `call_${currentUserId}_${targetGuid}_${Date.now()}`;
      const newSession: CallSessionData = {
        sessionId,
        callerId: currentUserId,
        callerName: callerName || currentUsername || "Friend",
        callerAvatar: callerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName || "Friend")}`,
        recipientId: targetGuid,
        recipientName: targetDisplayName,
        recipientAvatar: targetAvatarUrl,
        callType: callType || "voice",
        status: "RINGING",
        updatedAt: Date.now(),
        callerCandidates: [],
        recipientCandidates: []
      };

      if (sdp) newSession.sdpOffer = sdp;

      CALL_STATE_STORE.sessions.set(sessionId, newSession);

      [currentUserId, currentUsername, targetGuid, targetUsername, rawTarget, cleanTarget].forEach(k => {
        if (k) CALL_STATE_STORE.userSessionMap.set(k, sessionId);
      });

      // PUSH INSTANT RINGING SIGNAL TO RECIPIENT SSE STREAM (< 10ms!)
      if (targetGuid) pushSSEEventToUser(targetGuid, { type: "CALL_SIGNAL", session: newSession });
      if (targetUsername) pushSSEEventToUser(targetUsername, { type: "CALL_SIGNAL", session: newSession });
      if (cleanTarget) pushSSEEventToUser(cleanTarget, { type: "CALL_SIGNAL", session: newSession });

      return NextResponse.json({ success: true, session: newSession }, { status: 200 });
    }

    if (action === "SDP_OFFER" && session) {
      session.sdpOffer = sdp;
      session.updatedAt = Date.now();

      if (session.recipientId) pushSSEEventToUser(session.recipientId, { type: "CALL_SIGNAL", session });
      if (session.recipientName) pushSSEEventToUser(session.recipientName, { type: "CALL_SIGNAL", session });

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "ANSWER" && session) {
      session.status = "CONNECTED";
      if (sdp) session.sdpAnswer = sdp;
      session.updatedAt = Date.now();

      if (session.callerId) pushSSEEventToUser(session.callerId, { type: "CALL_SIGNAL", session });
      if (session.callerName) pushSSEEventToUser(session.callerName, { type: "CALL_SIGNAL", session });

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "SDP_ANSWER" && session) {
      session.sdpAnswer = sdp;
      session.updatedAt = Date.now();

      if (session.callerId) pushSSEEventToUser(session.callerId, { type: "CALL_SIGNAL", session });
      if (session.callerName) pushSSEEventToUser(session.callerName, { type: "CALL_SIGNAL", session });

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "ICE_CANDIDATE" && session && candidate) {
      const isCaller = currentUserId === session.callerId || currentUsername === session.callerName;
      if (isCaller) {
        if (!session.callerCandidates) session.callerCandidates = [];
        session.callerCandidates.push(candidate);
        if (session.recipientId) pushSSEEventToUser(session.recipientId, { type: "CALL_SIGNAL", session });
        if (session.recipientName) pushSSEEventToUser(session.recipientName, { type: "CALL_SIGNAL", session });
      } else {
        if (!session.recipientCandidates) session.recipientCandidates = [];
        session.recipientCandidates.push(candidate);
        if (session.callerId) pushSSEEventToUser(session.callerId, { type: "CALL_SIGNAL", session });
        if (session.callerName) pushSSEEventToUser(session.callerName, { type: "CALL_SIGNAL", session });
      }
      session.updatedAt = Date.now();
      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    return NextResponse.json({ success: true, session: session || null }, { status: 200 });
  } catch (error) {
    console.error("Call signaling error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/calls/signal - Instant State Check
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(userPayload.userId);
    const currentUsername = typeof userPayload.username === "string" ? userPayload.username.replace("@", "") : "";

    let sessionId = CALL_STATE_STORE.userSessionMap.get(currentUserId) || (currentUsername ? CALL_STATE_STORE.userSessionMap.get(currentUsername) : undefined);
    let session = sessionId ? CALL_STATE_STORE.sessions.get(sessionId) || null : null;

    if (!session) {
      const allSessions = Array.from(CALL_STATE_STORE.sessions.values());
      for (const sess of allSessions) {
        const isRecipientMatch = 
          sess.recipientId?.toLowerCase() === currentUserId.toLowerCase() ||
          sess.recipientName?.toLowerCase() === currentUsername.toLowerCase();
        const isCallerMatch = 
          sess.callerId?.toLowerCase() === currentUserId.toLowerCase() ||
          sess.callerName?.toLowerCase() === currentUsername.toLowerCase();

        if (isRecipientMatch || isCallerMatch) {
          session = sess;
          CALL_STATE_STORE.userSessionMap.set(currentUserId, sess.sessionId);
          if (currentUsername) CALL_STATE_STORE.userSessionMap.set(currentUsername, sess.sessionId);
          break;
        }
      }
    }

    return NextResponse.json({ session: session || null }, { status: 200 });
  } catch (error) {
    console.error("Call signal GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
