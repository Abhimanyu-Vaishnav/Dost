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

    // Forward signaling payload via SSE
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

    // Database CallSession Logging
    if (callId) {
      if (signalType === "call_offer") {
        await prisma.callSession.upsert({
          where: { id: callId },
          create: {
            id: callId,
            callerId: userPayload.userId,
            receiverId: targetUserId,
            type: callType === "VIDEO" ? "VIDEO" : "AUDIO",
            status: "RINGING",
            startedAt: new Date(),
          },
          update: {
            status: "RINGING",
          },
        }).catch(() => {});
      } else if (signalType === "call_answer") {
        await prisma.callSession.update({
          where: { id: callId },
          data: {
            status: "CONNECTED",
            startedAt: new Date(),
          },
        }).catch(() => {});
      } else if (signalType === "call_end") {
        const durationSeconds = body.duration || 0;
        await prisma.callSession.update({
          where: { id: callId },
          data: {
            status: "ENDED",
            duration: durationSeconds,
            endedAt: new Date(),
          },
        }).catch(() => {});

        // Inject Call Log Message in Chat Thread
        const existingSession = await prisma.callSession.findUnique({ where: { id: callId } });
        if (existingSession?.conversationId) {
          const durStr = durationSeconds > 0 ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s` : "0s";
          const callText = `📞 ${callType === "VIDEO" ? "Video" : "Voice"} call ended (${durStr})`;
          await prisma.message.create({
            data: {
              conversationId: existingSession.conversationId,
              senderId: userPayload.userId,
              content: callText,
              type: "SYSTEM",
            },
          }).catch(() => {});
        }
      } else if (signalType === "call_reject") {
        await prisma.callSession.update({
          where: { id: callId },
          data: {
            status: "DECLINED",
            endedAt: new Date(),
          },
        }).catch(() => {});

        const existingSession = await prisma.callSession.findUnique({ where: { id: callId } });
        if (existingSession?.conversationId) {
          await prisma.message.create({
            data: {
              conversationId: existingSession.conversationId,
              senderId: userPayload.userId,
              content: `📵 Call declined`,
              type: "SYSTEM",
            },
          }).catch(() => {});
        }
      } else if (signalType === "call_busy") {
        await prisma.callSession.update({
          where: { id: callId },
          data: {
            status: "MISSED",
            endedAt: new Date(),
          },
        }).catch(() => {});

        const existingSession = await prisma.callSession.findUnique({ where: { id: callId } });
        if (existingSession?.conversationId) {
          await prisma.message.create({
            data: {
              conversationId: existingSession.conversationId,
              senderId: userPayload.userId,
              content: `⚠️ Missed ${callType === "VIDEO" ? "video" : "voice"} call`,
              type: "SYSTEM",
            },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/calls/signal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
