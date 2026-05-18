import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const commentId = resolvedParams.id;
    const userId = user.userId as string;

    const existingLike = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
      return NextResponse.json({ message: "Comment unliked" }, { status: 200 });
    } else {
      await prisma.commentLike.create({
        data: { userId, commentId },
      });

      // Create notification
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { userId: true, postId: true }
      });

      if (comment && comment.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: "COMMENT_LIKE",
            userId: comment.userId,
            actorId: userId,
            postId: comment.postId
          }
        });
      }

      return NextResponse.json({ message: "Comment liked" }, { status: 200 });
    }
  } catch (error) {
    console.error("Comment Like error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
