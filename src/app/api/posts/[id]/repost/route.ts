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

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const hasQuoteContent = Boolean(
      (body.content && body.content.trim().length > 0) || 
      body.imageUrl || 
      body.videoUrl || 
      body.gifUrl
    );

    // 1. SIMPLE REPOST (No commentary content) - Single Toggle Repost Rule
    if (!hasQuoteContent) {
      const existingRepost = await prisma.post.findFirst({
        where: {
          authorId: userId,
          repostId: postId,
          content: "",
          imageUrl: null,
          videoUrl: null
        }
      });

      // If user has already reposted this post, TOGGLE OFF (Undo Repost)
      if (existingRepost) {
        await prisma.post.delete({
          where: { id: existingRepost.id }
        });

        return NextResponse.json({
          message: "Undo Repost",
          reposted: false,
          action: "removed"
        }, { status: 200 });
      }

      // Create new Simple Repost (Max 1 per user)
      const repost = await prisma.post.create({
        data: {
          content: "",
          authorId: userId,
          repostId: postId,
        },
      });

      // Send Notification to Original Author
      if (originalPost.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "REPOST",
            userId: originalPost.authorId,
            actorId: userId,
            postId: repost.id
          }
        }).catch(() => {});
      }

      return NextResponse.json({
        message: "Post reposted",
        reposted: true,
        action: "created",
        repost
      }, { status: 201 });
    }

    // 2. QUOTE POST (With commentary content) - Unlimited Quote Posts Rule
    const quotePost = await prisma.post.create({
      data: {
        content: body.content.trim(),
        imageUrl: body.imageUrl || null,
        videoUrl: body.videoUrl || null,
        gifUrl: body.gifUrl || null,
        authorId: userId,
        quotePostId: postId,
        repostId: postId,
      },
    });

    // Send Notification to Original Author for Quote
    if (originalPost.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: "QUOTE",
          userId: originalPost.authorId,
          actorId: userId,
          postId: quotePost.id
        }
      }).catch(() => {});
    }

    return NextResponse.json({
      message: "Quote post created",
      reposted: true,
      action: "quote_created",
      repost: quotePost
    }, { status: 201 });

  } catch (error) {
    console.error("Repost error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
