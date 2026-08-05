import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: storyId } = await params;
    const { emoji } = await request.json();

    if (!emoji) return NextResponse.json({ error: "Emoji is required" }, { status: 400 });

    const reaction = await prisma.storyReaction.upsert({
      where: {
        storyId_userId_emoji: {
          storyId,
          userId: user.userId as string,
          emoji,
        },
      },
      update: {},
      create: {
        storyId,
        userId: user.userId as string,
        emoji,
      },
    });

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (error) {
    console.error("Story reaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
