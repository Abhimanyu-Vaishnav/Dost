import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { MessageType } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyText } = await request.json();

    if (!replyText || !replyText.trim()) {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: { select: { id: true, name: true, username: true } }
      }
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const senderId = user.userId as string;
    const targetUserId = story.authorId;

    // Find or create conversation between viewer and story creator
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: senderId, role: "ADMIN" },
              { userId: targetUserId, role: "MEMBER" }
            ]
          }
        }
      });
    }

    // Create Direct Message referencing story
    const storySnippet = story.content ? `"${story.content.slice(0, 30)}..."` : "Story";
    const formattedContent = `Replied to your ${storySnippet}: ${replyText.trim()}`;

    const message = await prisma.message.create({
      data: {
        content: formattedContent,
        type: MessageType.TEXT,
        mediaUrl: story.mediaUrl || null,
        senderId,
        conversationId: conversation.id
      }
    });

    return NextResponse.json({ message, conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    console.error("Story DM reply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
