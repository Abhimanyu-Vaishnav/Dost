export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { presenceManager } from "@/lib/presence/presence-manager";
import { prisma } from "@/lib/prisma";

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

    const senderIdStr = String(userPayload.userId);

    // Resolve real target user DB ID (whether passed as user ID or username)
    let targetDbUser = await prisma.user.findUnique({ where: { id: String(targetUserId) } });
    if (!targetDbUser) {
      targetDbUser = await prisma.user.findFirst({
        where: { username: String(targetUserId) },
      });
    }
    const realReceiverId = targetDbUser ? targetDbUser.id : String(targetUserId);

    // Forward signaling payload via SSE
    presenceManager.sendToUser(realReceiverId, {
      type: "call_signal",
      payload: {
        signalType, // "call_offer" | "call_answer" | "ice_candidate" | "call_end" | "call_reject" | "call_busy"
        senderId: senderIdStr,
        targetUserId: realReceiverId,
        callType: callType || "VOICE",
        callId,
        sdp,
        candidate,
        caller,
      },
    });

    // Database CallSession & Chat Log Integration
    if (callId) {
      // Find or create conversation for this pair
      let conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: senderIdStr } } },
            { participants: { some: { userId: realReceiverId } } },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            isGroup: false,
            participants: {
              create: [
                { userId: senderIdStr },
                { userId: realReceiverId },
              ],
            },
          },
        });
      }

      const conversationId = conversation.id;

      if (signalType === "call_offer") {
        await prisma.callSession.upsert({
          where: { id: callId },
          create: {
            id: callId,
            conversationId,
            callerId: senderIdStr,
            receiverId: realReceiverId,
            type: callType === "VIDEO" ? "VIDEO" : "AUDIO",
            status: "RINGING",
            startedAt: new Date(),
          },
          update: {
            conversationId,
            status: "RINGING",
          },
        }).catch((err) => console.error("CallSession upsert offer error:", err));
      } else if (signalType === "call_answer") {
        await prisma.callSession.upsert({
          where: { id: callId },
          create: {
            id: callId,
            conversationId,
            callerId: senderIdStr,
            receiverId: realReceiverId,
            type: callType === "VIDEO" ? "VIDEO" : "AUDIO",
            status: "CONNECTED",
            startedAt: new Date(),
          },
          update: {
            status: "CONNECTED",
            startedAt: new Date(),
          },
        }).catch((err) => console.error("CallSession update answer error:", err));
      } else if (signalType === "call_end") {
        const durationSeconds = body.duration || 0;
        await prisma.callSession.upsert({
          where: { id: callId },
          create: {
            id: callId,
            conversationId,
            callerId: senderIdStr,
            receiverId: realReceiverId,
            type: callType === "VIDEO" ? "VIDEO" : "AUDIO",
            status: "ENDED",
            duration: durationSeconds,
            endedAt: new Date(),
          },
          update: {
            status: "ENDED",
            duration: durationSeconds,
            endedAt: new Date(),
          },
        }).catch((err) => console.error("CallSession update end error:", err));

        // Inject Call Log System Message in Chat Thread
        const durStr = durationSeconds > 0 ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s` : "0s";
        const callText = `📞 ${callType === "VIDEO" ? "Video" : "Voice"} call ended (${durStr})`;
        await prisma.message.create({
          data: {
            conversationId,
            senderId: senderIdStr,
            content: callText,
            type: "SYSTEM",
          },
        }).catch(() => {});
      } else if (signalType === "call_reject") {
        await prisma.callSession.upsert({
          where: { id: callId },
          create: {
            id: callId,
            conversationId,
            callerId: senderIdStr,
            receiverId: realReceiverId,
            type: callType === "VIDEO" ? "VIDEO" : "AUDIO",
            status: "DECLINED",
            endedAt: new Date(),
          },
          update: {
            status: "DECLINED",
            endedAt: new Date(),
          },
        }).catch((err) => console.error("CallSession update reject error:", err));

        await prisma.message.create({
          data: {
            conversationId,
            senderId: senderIdStr,
            content: `📵 Call declined`,
            type: "SYSTEM",
          },
        }).catch(() => {});
      } else if (signalType === "call_busy") {
        await prisma.callSession.upsert({
          where: { id: callId },
          create: {
            id: callId,
            conversationId,
            callerId: senderIdStr,
            receiverId: realReceiverId,
            type: callType === "VIDEO" ? "VIDEO" : "AUDIO",
            status: "MISSED",
            endedAt: new Date(),
          },
          update: {
            status: "MISSED",
            endedAt: new Date(),
          },
        }).catch((err) => console.error("CallSession update busy error:", err));

        await prisma.message.create({
          data: {
            conversationId,
            senderId: senderIdStr,
            content: `⚠️ Missed ${callType === "VIDEO" ? "video" : "voice"} call`,
            type: "SYSTEM",
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/calls/signal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
