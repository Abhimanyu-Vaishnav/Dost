import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = user.userId as string;

    const { searchParams } = new URL(request.url);
    const convId = searchParams.get("convId");

    if (!convId) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: convId },
      include: {
        participants: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    // Mark unread messages sent by others as read
    await prisma.message.updateMany({
      where: {
        conversationId: convId,
        senderId: { not: currentUserId },
        isRead: false
      },
      data: { isRead: true }
    });

    const dbMessages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    const messages = dbMessages.map((m) => {
      const isMe = m.senderId === currentUserId;
      let textContent = m.content || "";
      let imgUrl = undefined;
      let audUrl = undefined;

      if (m.messageType === "IMAGE" || (m.fileUrl && (m.fileUrl.endsWith(".jpg") || m.fileUrl.endsWith(".png") || m.fileUrl.endsWith(".webp") || m.fileUrl.startsWith("data:image")))) {
        imgUrl = m.fileUrl || undefined;
      } else if (m.messageType === "AUDIO" || (m.fileUrl && (m.fileUrl.endsWith(".webm") || m.fileUrl.endsWith(".mp3") || m.fileUrl.startsWith("data:audio")))) {
        audUrl = m.fileUrl || undefined;
      }

      return {
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender?.name || m.sender?.username || "User",
        text: textContent,
        imageUrl: imgUrl,
        audioUrl: audUrl,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMe,
        isDelivered: true,
        isRead: m.isRead,
        reactions: []
      };
    });

    return NextResponse.json({ messages, conversation }, { status: 200 });
  } catch (e) {
    console.error("GET /api/messages error:", e);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = user.userId as string;

    const body = await request.json();
    let { convId, targetUserId, text, imageUrl, audioUrl, senderName, messageType } = body;

    if (!convId && !targetUserId) {
      return NextResponse.json({ error: "Invalid parameters: conversationId or targetUserId required" }, { status: 400 });
    }

    let conversationId = convId;

    // If no conversationId provided or convId is a target user fallback, find or create conversation
    if (!conversationId || conversationId.startsWith("conv-")) {
      const actualTargetId = targetUserId || (conversationId ? conversationId.replace("conv-", "") : null);
      if (actualTargetId) {
        // Find user by id or username
        const targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: actualTargetId },
              { username: actualTargetId }
            ]
          }
        });

        if (targetUser && targetUser.id !== currentUserId) {
          let existingConv = await prisma.conversation.findFirst({
            where: {
              AND: [
                { participants: { some: { id: currentUserId } } },
                { participants: { some: { id: targetUser.id } } }
              ]
            }
          });

          if (!existingConv) {
            existingConv = await prisma.conversation.create({
              data: {
                participants: {
                  connect: [{ id: currentUserId }, { id: targetUser.id }]
                }
              }
            });
          }
          conversationId = existingConv.id;
        }
      }
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const type = messageType || (imageUrl ? "IMAGE" : audioUrl ? "AUDIO" : "TEXT");
    const fileUrl = imageUrl || audioUrl || null;

    const createdMsg = await prisma.message.create({
      data: {
        content: text || "",
        messageType: type,
        fileUrl: fileUrl,
        senderId: currentUserId,
        conversationId: conversationId
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    const formattedMsg = {
      id: createdMsg.id,
      senderId: currentUserId,
      senderName: createdMsg.sender?.name || createdMsg.sender?.username || "You",
      text: createdMsg.content || "",
      imageUrl: type === "IMAGE" ? createdMsg.fileUrl || undefined : undefined,
      audioUrl: type === "AUDIO" ? createdMsg.fileUrl || undefined : undefined,
      timestamp: new Date(createdMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reactions: [],
      isDelivered: true,
      isRead: false,
      isMe: true,
      conversationId: conversationId
    };

    return NextResponse.json({ success: true, message: formattedMsg, conversationId }, { status: 201 });
  } catch (e) {
    console.error("POST /api/messages error:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

