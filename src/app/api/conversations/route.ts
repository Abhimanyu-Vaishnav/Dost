export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { MessageService } from "@/lib/messaging/message-service";

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = userPayload.userId as string;
    const conversations = await MessageService.getUserConversations(currentUserId);

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = userPayload.userId as string;
    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const conversation = await MessageService.getOrCreate1v1Conversation(currentUserId, targetUserId);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json({ error: error.message || "Failed to create conversation" }, { status: 500 });
  }
}
