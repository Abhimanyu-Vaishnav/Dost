export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = userPayload.userId as string;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, MISSED, INCOMING, OUTGOING
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    const calls = await prisma.callSession.findMany({
      where: {
        OR: [
          { callerId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        caller: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formattedCalls = calls
      .map((call) => {
        const isCaller = call.callerId === currentUserId;
        const peer = isCaller ? call.receiver : call.caller;
        
        let direction: "INCOMING" | "OUTGOING" | "MISSED" = "INCOMING";
        if (isCaller) {
          direction = "OUTGOING";
        } else if (call.status === "MISSED" || call.status === "DECLINED") {
          direction = "MISSED";
        }

        const safePeer = peer || {
          id: isCaller ? call.receiverId : call.callerId,
          name: "DOST User",
          username: "user",
          avatar: "https://ui-avatars.com/api/?name=User",
        };

        return {
          id: call.id,
          callId: call.id,
          type: call.type === "VIDEO" ? "VIDEO" : "VOICE",
          status: call.status,
          direction,
          duration: call.duration || 0,
          createdAt: call.createdAt,
          partner: safePeer,
        };
      })
      .filter((call) => {
        // Filter by tab
        if (filter === "MISSED" && call.direction !== "MISSED") return false;
        if (filter === "INCOMING" && call.direction !== "INCOMING") return false;
        if (filter === "OUTGOING" && call.direction !== "OUTGOING") return false;

        // Filter by search query
        if (query) {
          const peerName = (call.partner?.name || "").toLowerCase();
          const peerUsername = (call.partner?.username || "").toLowerCase();
          return peerName.includes(query) || peerUsername.includes(query);
        }

        return true;
      });

    return NextResponse.json({ calls: formattedCalls });
  } catch (error) {
    console.error("GET /api/calls/history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
