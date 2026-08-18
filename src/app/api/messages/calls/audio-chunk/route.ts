import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

interface AudioChunk {
  senderId: string;
  senderName: string;
  blobBase64: string;
  timestamp: number;
}

// In-memory audio chunk buffer: sessionId -> AudioChunk[]
const AUDIO_CHUNK_BUFFER: Map<string, AudioChunk[]> = new Map();

// POST /api/messages/calls/audio-chunk - Push recorded mic audio chunk (300ms PCM/WebM slice)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = String(userPayload.userId);
    const senderName = typeof userPayload.username === "string" ? userPayload.username.replace("@", "") : "";
    const body = await req.json();
    const { sessionId, blobBase64 } = body;

    if (!sessionId || !blobBase64) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (!AUDIO_CHUNK_BUFFER.has(sessionId)) {
      AUDIO_CHUNK_BUFFER.set(sessionId, []);
    }

    const chunks = AUDIO_CHUNK_BUFFER.get(sessionId)!;
    chunks.push({
      senderId,
      senderName,
      blobBase64,
      timestamp: Date.now()
    });

    // Keep only last 20 chunks to prevent memory buildup
    if (chunks.length > 20) {
      AUDIO_CHUNK_BUFFER.set(sessionId, chunks.slice(chunks.length - 20));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Audio chunk POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/messages/calls/audio-chunk?sessionId=xyz - Poll unread audio chunks for peer
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPayload: any = await verifyToken(token);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(userPayload.userId);
    const currentUsername = typeof userPayload.username === "string" ? userPayload.username.replace("@", "").toLowerCase() : "";
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId || !AUDIO_CHUNK_BUFFER.has(sessionId)) {
      return NextResponse.json({ chunks: [] }, { status: 200 });
    }

    const allChunks = AUDIO_CHUNK_BUFFER.get(sessionId)!;
    // Get chunks sent by PEER (filter out self GUID and self username strictly)
    const peerChunks = allChunks.filter(c => {
      const cName = c.senderName?.replace("@", "").toLowerCase();
      const isSelf = c.senderId === currentUserId || cName === currentUsername;
      const isRecent = Date.now() - c.timestamp < 5000;
      return !isSelf && isRecent;
    });

    // Drain retrieved chunks
    AUDIO_CHUNK_BUFFER.set(
      sessionId,
      allChunks.filter(c => {
        const cName = c.senderName?.replace("@", "").toLowerCase();
        return c.senderId === currentUserId || cName === currentUsername || Date.now() - c.timestamp >= 5000;
      })
    );

    return NextResponse.json({ chunks: peerChunks }, { status: 200 });
  } catch (error) {
    console.error("Audio chunk GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
