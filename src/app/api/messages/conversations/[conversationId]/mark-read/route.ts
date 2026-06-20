import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { conversationId } = resolvedParams;

    // Verify user is a participant of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true } } }
    });

    if (!conversation || !conversation.participants.some(p => p.id === user.userId)) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    // Mark messages as read
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

    return NextResponse.json({ message: "Messages marked as read" }, { status: 200 });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
