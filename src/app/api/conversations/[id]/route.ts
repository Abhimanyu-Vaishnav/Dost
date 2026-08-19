export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const conversationId = resolvedParams.id;

    // Verify user is a participant of this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        userId: userPayload.userId,
        conversationId,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Delete all messages in the conversation
    await prisma.message.deleteMany({
      where: { conversationId },
    });

    // Delete participants
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId },
    });

    // Delete the conversation record
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("DELETE /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
