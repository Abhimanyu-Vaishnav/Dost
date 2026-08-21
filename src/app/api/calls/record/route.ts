export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageService } from "@/lib/messaging/message-service";

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = userPayload.userId as string;
    const body = await request.json();
    const { targetUserId, audioData, callType, callId } = body;

    if (!targetUserId || !audioData) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Find conversation between current user and targetUser
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: currentUserId },
              { userId: targetUserId },
            ],
          },
        },
      });
    }

    // Send recording as audio message attachment in chat thread
    const isVideo = callType === "VIDEO";
    const recordingText = `🎙️ ${isVideo ? "Video" : "Voice"} call recording attachment`;

    const message = await MessageService.sendMessage(currentUserId, {
      conversationId: conversation.id,
      content: recordingText,
      type: "AUDIO",
      mediaUrl: audioData,
      fileName: `Call_Recording_${Date.now()}.${isVideo ? "webm" : "webm"}`,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("POST /api/calls/record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
