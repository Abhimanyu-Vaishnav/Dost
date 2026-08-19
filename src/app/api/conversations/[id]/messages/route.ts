export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { MessageService } from "@/lib/messaging/message-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const currentUserId = userPayload.userId as string;

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 30;

    const data = await MessageService.getConversationMessages(
      conversationId,
      currentUserId,
      cursor,
      limit
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/conversations/[id]/messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}
