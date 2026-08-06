import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const postId = resolvedParams.id;
    const { optionId } = await req.json();

    const post = await (prisma.post as any).findUnique({
      where: { id: postId },
      select: { id: true, pollData: true }
    });

    if (!post || !post.pollData) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    let poll = typeof post.pollData === "string" ? JSON.parse(post.pollData) : post.pollData;
    const userId = user.userId as string;

    // Register/update user's vote across options
    poll.options = poll.options.map((opt: any) => {
      const votes = (opt.votes || []).filter((v: string) => v !== userId);
      if (opt.id === optionId) {
        votes.push(userId);
      }
      return { ...opt, votes };
    });

    const updatedPollString = JSON.stringify(poll);

    await (prisma.post as any).update({
      where: { id: postId },
      data: { pollData: updatedPollString }
    });

    return NextResponse.json({ pollData: poll }, { status: 200 });
  } catch (error) {
    console.error("Poll vote error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
