import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { conversationId } = resolvedParams;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true, name: true, avatar: true, lastSeen: true } } }
    });

    if (!conversation || !conversation.participants.some(p => p.id === user.userId)) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.userId as string },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    return NextResponse.json({ messages, conversation });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { conversationId } = resolvedParams;
    const { content, messageType, fileUrl } = await request.json();

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: "Content or fileUrl is required" }, { status: 400 });
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } }
    });

    if (!conversation || !conversation.participants.some(p => p.id === user.userId)) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        content: content || null,
        messageType: messageType || "TEXT",
        fileUrl: fileUrl || null,
        senderId: user.userId as string,
        conversationId
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { conversationId } = resolvedParams;
    const { messageIds } = await request.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: "messageIds must be a non-empty array" }, { status: 400 });
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } }
    });

    if (!conversation || !conversation.participants.some(p => p.id === user.userId)) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const deleteResult = await prisma.message.deleteMany({
      where: {
        id: { in: messageIds },
        conversationId
      }
    });

    return NextResponse.json({ success: true, count: deleteResult.count });
  } catch (error) {
    console.error("Delete messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

