import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { optionIndex, pollId } = await request.json();

    if (optionIndex === undefined || !pollId) {
      return NextResponse.json({ error: "pollId and optionIndex are required" }, { status: 400 });
    }

    const vote = await prisma.storyPollVote.upsert({
      where: {
        pollId_userId: {
          pollId,
          userId: user.userId as string,
        },
      },
      update: { optionIndex },
      create: {
        pollId,
        userId: user.userId as string,
        optionIndex,
      },
    });

    return NextResponse.json({ vote }, { status: 201 });
  } catch (error) {
    console.error("Story poll vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
