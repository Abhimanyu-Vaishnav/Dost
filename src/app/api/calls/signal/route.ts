import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CALL_STATE_STORE, CallSessionData, pushSSEEventToUser } from "@/lib/callEngine";

// POST /api/calls/signal - Two-Way Instant Signaling Router
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

      const allSessions = Array.from(CALL_STATE_STORE.sessions.values());
      for (const sess of allSessions) {
        const isMatch = sess.callerId === currentUserId || 
                        sess.recipientId === currentUserId ||
                        sess.callerName?.replace("@", "").toLowerCase() === currentUsername.toLowerCase() ||
                        sess.recipientName?.replace("@", "").toLowerCase() === currentUsername.toLowerCase();
        if (isMatch) {
          targetSession = sess;
          break;
        }
      }

      if (targetSession) {
        const finalStatus = action === "REJECT" ? "REJECTED" : "ENDED";
        targetSession.status = finalStatus;
        targetSession.updatedAt = Date.now();

        const payload = { type: "CALL_TERMINATED", session: targetSession, action: finalStatus };

        // Push termination signal to both peers instantly via SSE
        if (targetSession.callerId) pushSSEEventToUser(targetSession.callerId, payload);
        if (targetSession.callerName) pushSSEEventToUser(targetSession.callerName, payload);
        if (targetSession.recipientId) pushSSEEventToUser(targetSession.recipientId, payload);
        if (targetSession.recipientName) pushSSEEventToUser(targetSession.recipientName, payload);

        const sessId = targetSession.sessionId;
        setTimeout(() => {
          CALL_STATE_STORE.sessions.delete(sessId);
          Array.from(CALL_STATE_STORE.userSessionMap.entries()).forEach(([k, v]) => {
            if (v === sessId) CALL_STATE_STORE.userSessionMap.delete(k);
          });
        }, 15000);

        return NextResponse.json({ success: true, session: targetSession }, { status: 200 });
      }

      return NextResponse.json({ success: true, session: null }, { status: 200 });
    }

    let session: CallSessionData | undefined = undefined;
    const allSessions = Array.from(CALL_STATE_STORE.sessions.values());
    for (const sess of allSessions) {
      if (sess.status === "ENDED" || sess.status === "REJECTED") continue;
      const isMatch = sess.callerId === currentUserId || 
                      sess.recipientId === currentUserId ||
                      sess.callerName?.replace("@", "").toLowerCase() === currentUsername.toLowerCase() ||
                      sess.recipientName?.replace("@", "").toLowerCase() === currentUsername.toLowerCase();
      if (isMatch) {
        session = sess;
        break;
      }
    }

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
        if (k) CALL_STATE_STORE.userSessionMap.set(k.toLowerCase(), sessionId);
      });

      // Push instant ringing signal to recipient SSE stream (< 10ms)
      const payload = { type: "CALL_SIGNAL", session: newSession };
      if (targetGuid) pushSSEEventToUser(targetGuid, payload);
      if (targetUsername) pushSSEEventToUser(targetUsername, payload);
      if (cleanTarget) pushSSEEventToUser(cleanTarget, payload);

      return NextResponse.json({ success: true, session: newSession }, { status: 200 });
    }

    if (action === "SDP_OFFER" && session) {
      session.sdpOffer = sdp;
      session.updatedAt = Date.now();

      const payload = { type: "CALL_SIGNAL", session };
      if (session.recipientId) pushSSEEventToUser(session.recipientId, payload);
      if (session.recipientName) pushSSEEventToUser(session.recipientName, payload);

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "ANSWER" && session) {
      session.status = "CONNECTED";
      if (sdp) session.sdpAnswer = sdp;
      session.updatedAt = Date.now();

      const payload = { type: "CALL_ACCEPTED", session };
      if (session.callerId) pushSSEEventToUser(session.callerId, payload);
      if (session.callerName) pushSSEEventToUser(session.callerName, payload);

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "SDP_ANSWER" && session) {
      session.sdpAnswer = sdp;
      session.status = "CONNECTED";
      session.updatedAt = Date.now();

      const payload = { type: "CALL_ACCEPTED", session };
      if (session.callerId) pushSSEEventToUser(session.callerId, payload);
      if (session.callerName) pushSSEEventToUser(session.callerName, payload);

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    if (action === "ICE_CANDIDATE" && session && candidate) {
      const isCaller = currentUserId === session.callerId || currentUsername === session.callerName;
      if (isCaller) {
        if (!session.callerCandidates) session.callerCandidates = [];
        session.callerCandidates.push(candidate);
        const payload = { type: "CALL_SIGNAL", session };
        if (session.recipientId) pushSSEEventToUser(session.recipientId, payload);
        if (session.recipientName) pushSSEEventToUser(session.recipientName, payload);
      } else {
        if (!session.recipientCandidates) session.recipientCandidates = [];
        session.recipientCandidates.push(candidate);
        const payload = { type: "CALL_SIGNAL", session };
        if (session.callerId) pushSSEEventToUser(session.callerId, payload);
        if (session.callerName) pushSSEEventToUser(session.callerName, payload);
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

// GET /api/calls/signal - State Query Endpoint
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(userPayload.userId).toLowerCase();
    const currentUsername = typeof userPayload.username === "string" ? userPayload.username.replace("@", "").toLowerCase() : "";

    let session: CallSessionData | null = null;
    const allSessions = Array.from(CALL_STATE_STORE.sessions.values());

    for (const sess of allSessions) {
      if (sess.status === "ENDED" || sess.status === "REJECTED") continue;

      const cId = sess.callerId?.toLowerCase();
      const cName = sess.callerName?.replace("@", "").toLowerCase();
      const rId = sess.recipientId?.toLowerCase();
      const rName = sess.recipientName?.replace("@", "").toLowerCase();

      const isCaller = cId === currentUserId || cName === currentUserId || (currentUsername && (cId === currentUsername || cName === currentUsername));
      const isRecipient = rId === currentUserId || rName === currentUserId || (currentUsername && (rId === currentUsername || rName === currentUsername));

      if (isCaller || isRecipient) {
        session = sess;
        break;
      }
    }

    return NextResponse.json({ session: session || null }, { status: 200 });
  } catch (error) {
    console.error("Call signal GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
