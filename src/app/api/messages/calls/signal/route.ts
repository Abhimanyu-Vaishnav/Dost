import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId, action, type, sdp, candidate, sessionId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    if (action === "START") {
      const session = await prisma.callSession.create({
        data: {
          conversationId,
          callerId: user.userId as string,
          type: type || "VIDEO",
          status: "RINGING",
          sdp: sdp ? JSON.stringify(sdp) : null,
        },
      });
      return NextResponse.json({ session });
    }

    if (action === "SIGNAL" && sessionId) {
      const session = await prisma.callSession.findUnique({ where: { id: sessionId } });
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      let candidatesArr = session.candidates ? JSON.parse(session.candidates) : [];
      if (candidate) candidatesArr.push(candidate);

      const updated = await prisma.callSession.update({
        where: { id: sessionId },
        data: {
          sdp: sdp ? JSON.stringify(sdp) : session.sdp,
          candidates: JSON.stringify(candidatesArr),
        },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === "END" && sessionId) {
      const updated = await prisma.callSession.update({
        where: { id: sessionId },
        data: { status: "ENDED" },
      });
      return NextResponse.json({ session: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Call signal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversationId = request.nextUrl.searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

    const activeSession = await prisma.callSession.findFirst({
      where: {
        conversationId,
        status: { in: ["RINGING", "CONNECTED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ session: activeSession });
  } catch (error) {
    console.error("Get call session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
