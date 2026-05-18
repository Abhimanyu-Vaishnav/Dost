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

    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let content = "";
    try {
      const body = await req.json();
      if (body.content) content = body.content;
    } catch (e) {
      // Ignore JSON parse error if body is empty
    }

    const repost = await prisma.post.create({
      data: {
        content: content,
        authorId: userId,
        repostId: postId,
      },
    });

    // Create notification
    if (originalPost.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: content ? "QUOTE" : "REPOST",
          userId: originalPost.authorId,
          actorId: userId,
          postId: repost.id // Link to the NEW post (the quote/repost itself)
        }
      });
    }

    return NextResponse.json({ message: "Post reposted", repost }, { status: 201 });
  } catch (error) {
    console.error("Repost error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
