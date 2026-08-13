import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// In-Memory store fallback for demo real-time chat messages
let GLOBAL_MESSAGES_STORE: Record<string, any[]> = {
  "conv-1": [
    { id: "m1", senderId: "conv-1", senderName: "Shalini Goyal", text: "Hey Abhimanyu! How's the DOST application build coming along?", timestamp: "12:40 PM", isMe: false },
    { id: "m2", senderId: "me", senderName: "You", text: "It's going amazing! Just deployed infinite feed scroll and particle explosions 🚀", timestamp: "12:42 PM", isMe: true, reactions: ["🔥"] },
    { id: "m3", senderId: "conv-1", senderName: "Shalini Goyal", text: "The new DOST Shorts update looks incredible! 🔥", timestamp: "12:45 PM", isMe: false, reactions: ["❤️"] }
  ],
  "conv-2": [
    { id: "m4", senderId: "conv-2", senderName: "Devansh Nambiar", text: "Hey, check out this new lofi track for the Audio Space", timestamp: "11:20 AM", isMe: false }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const convId = searchParams.get("convId") || "conv-1";
    const messages = GLOBAL_MESSAGES_STORE[convId] || [];
    return NextResponse.json({ messages }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { convId, text, imageUrl, audioUrl } = body;

    if (!convId || (!text && !imageUrl && !audioUrl)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: user?.userId || "me",
      senderName: user?.name || "You",
      text: text || "",
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
      reactions: []
    };

    if (!GLOBAL_MESSAGES_STORE[convId]) {
      GLOBAL_MESSAGES_STORE[convId] = [];
    }

    GLOBAL_MESSAGES_STORE[convId].push(newMsg);

    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
