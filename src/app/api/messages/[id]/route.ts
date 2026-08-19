export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { MessageService } from "@/lib/messaging/message-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const currentUserId = userPayload.userId as string;
    const body = await request.json();

    if (body.action === "delete") {
      const mode = body.mode === "me" ? "me" : "everyone";
      const result = await MessageService.deleteMessage(currentUserId, messageId, mode);
      return NextResponse.json({ success: true, result });
    }

    // Default PATCH action is Edit message
    const { content } = body;
    if (!content) {
      return NextResponse.json({ error: "Content is required for editing" }, { status: 400 });
    }

    const updatedMessage = await MessageService.editMessage(currentUserId, messageId, content);

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error: any) {
    console.error("PATCH /api/messages/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to edit/delete message" }, { status: 500 });
  }
}
