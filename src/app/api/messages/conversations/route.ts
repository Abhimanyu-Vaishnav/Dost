import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserId = String(user.userId);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: currentUserId }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const conversationsFormatted = await Promise.all(
      conversations.map(async (conv) => {
        const partner = conv.participants.find(p => p.id !== currentUserId) || conv.participants[0];
        
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: currentUserId },
            isRead: false
          }
        });

        const lastMsg = conv.messages[0];
        const partnerName = partner?.name || partner?.username || "Friend";
        const partnerUsername = partner?.username ? partner.username.replace("@", "") : partnerName.toLowerCase().replace(/\s+/g, "");
        const partnerAvatar = partner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=00f2fe&color=ffffff&bold=true`;

        return {
          id: conv.id,
          partnerId: partner?.id || partnerUsername,
          name: partnerName,
          username: partnerUsername,
          avatar: partnerAvatar,
          isOnline: true,
          unreadCount,
          lastMessage: lastMsg?.content || (lastMsg?.fileUrl ? "📷 Attachment" : "No messages yet"),
          lastTime: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
        };
      })
    );

    return NextResponse.json({ conversations: conversationsFormatted });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
