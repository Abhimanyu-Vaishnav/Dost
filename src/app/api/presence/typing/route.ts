export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { presenceManager } from "@/lib/presence/presence-manager";

export async function POST(request: NextRequest) {
  const userPayload = await getUserFromRequest(request);

  if (!userPayload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = userPayload.userId as string;
  let body: { conversationId?: string; isTyping?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, isTyping } = body;

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  if (typeof isTyping !== "boolean") {
    return NextResponse.json({ error: "isTyping boolean is required" }, { status: 400 });
  }

  presenceManager.setTyping(userId, conversationId, isTyping);

  return NextResponse.json({
    success: true,
    userId,
    conversationId,
    isTyping,
  });
}
