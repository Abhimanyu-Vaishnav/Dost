import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { TYPING_STORES } from "@/lib/typingStore";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { conversationId, isTyping } = body;
    if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

    const key = `${conversationId}:${user.userId}`;
    if (isTyping) {
      TYPING_STORES.set(key, Date.now());
    } else {
      TYPING_STORES.delete(key);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Typing API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
