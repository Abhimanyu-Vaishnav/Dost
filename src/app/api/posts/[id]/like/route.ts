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
    const postId = resolvedParams.id;
    const userId = user.userId as string;

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    let isLiked = false;

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      isLiked = false;
    } else {
      await prisma.like.create({
        data: { userId, postId },
      });
      isLiked = true;

      // Create notification
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });

      if (post && post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            userId: post.authorId,
            actorId: userId,
            postId: postId
          }
        });
      }
    }

    const count = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ success: true, isLiked, count, message: isLiked ? "Post liked" : "Post unliked" }, { status: 200 });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
