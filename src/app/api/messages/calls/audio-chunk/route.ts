import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

interface AudioChunk {
  sessionId: string;
  senderId: string;
  senderName: string;
  blobBase64: string;
  timestamp: number;
}

// In-memory global singleton audio chunk buffer (Attached to globalThis for Next.js API route persistence)
const globalForAudioChunks = globalThis as unknown as {
  audioChunkBufferMap?: Map<string, AudioChunk[]>;
};

const AUDIO_CHUNK_BUFFER = globalForAudioChunks.audioChunkBufferMap || 
  (globalForAudioChunks.audioChunkBufferMap = new Map<string, AudioChunk[]>());

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

    const chunkKey = "global_active_call";
    if (!AUDIO_CHUNK_BUFFER.has(chunkKey)) {
      AUDIO_CHUNK_BUFFER.set(chunkKey, []);
    }

    const chunks = AUDIO_CHUNK_BUFFER.get(chunkKey)!;
    chunks.push({
      sessionId,
      senderId,
      senderName,
      blobBase64,
      timestamp: Date.now()
    });

    // Keep only last 30 chunks to prevent memory buildup
    if (chunks.length > 30) {
      AUDIO_CHUNK_BUFFER.set(chunkKey, chunks.slice(chunks.length - 30));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Audio chunk POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/messages/calls/audio-chunk - Poll unread audio chunks for peer
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

    const chunkKey = "global_active_call";
    if (!AUDIO_CHUNK_BUFFER.has(chunkKey)) {
      return NextResponse.json({ chunks: [] }, { status: 200 });
    }

    const allChunks = AUDIO_CHUNK_BUFFER.get(chunkKey)!;
    // Get chunks sent by PEER (filter out self GUID and self username strictly)
    const peerChunks = allChunks.filter(c => {
      const cName = c.senderName?.replace("@", "").toLowerCase();
      const isSelf = c.senderId === currentUserId || cName === currentUsername;
      const isRecent = Date.now() - c.timestamp < 6000;
      return !isSelf && isRecent;
    });

    // Drain retrieved peer chunks
    if (peerChunks.length > 0) {
      const peerChunkSet = new Set(peerChunks);
      AUDIO_CHUNK_BUFFER.set(
        chunkKey,
        allChunks.filter(c => !peerChunkSet.has(c))
      );
    }

    return NextResponse.json({ chunks: peerChunks }, { status: 200 });
  } catch (error) {
    console.error("Audio chunk GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
