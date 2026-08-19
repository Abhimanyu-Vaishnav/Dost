export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { MessageService } from "@/lib/messaging/message-service";

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = userPayload.userId as string;
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const result = await MessageService.markMessagesAsRead(currentUserId, conversationId);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/messages/read error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark messages as read" }, { status: 500 });
  }
}
