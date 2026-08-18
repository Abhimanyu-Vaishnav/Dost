import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target User ID is required" }, { status: 400 });
    }

    // Resolve target user by ID or Username
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetUserId },
          { username: targetUserId }
        ]
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.userId === targetUser.id) {
      return NextResponse.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
    }

    // Check if conversation already exists between these two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: user.userId as string } } },
          { participants: { some: { id: targetUser.id } } }
        ]
      }
    });

    if (existingConversation) {
      return NextResponse.json({ conversationId: existingConversation.id });
    }

    // Create a new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [
            { id: user.userId as string },
            { id: targetUser.id }
          ]
        }
      }
    });

    return NextResponse.json({ conversationId: newConversation.id });
  } catch (error) {
    console.error("Start conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
