import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUserId = user.userId as string;

    const count = await prisma.message.count({
      where: {
        conversation: {
          participants: {
            some: { userId: currentUserId }
          }
        },
        senderId: { not: currentUserId },
        statuses: {
          none: {
            userId: currentUserId,
            status: "READ"
          }
        }
      }
    });

    const latestUnread = await prisma.message.findFirst({
      where: {
        conversation: {
          participants: {
            some: { userId: currentUserId }
          }
        },
        senderId: { not: currentUserId },
        statuses: {
          none: {
            userId: currentUserId,
            status: "READ"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        sender: {
          select: { name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ 
      count, 
      latestUnread: latestUnread ? {
        id: latestUnread.id,
        senderName: latestUnread.sender.name,
        content: latestUnread.content || (latestUnread.type !== "TEXT" ? `Sent a ${latestUnread.type.toLowerCase()}` : ""),
        conversationId: latestUnread.conversationId,
        createdAt: latestUnread.createdAt
      } : null 
    });
  } catch (error) {
    console.error("Fetch unread message count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
