import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "for-you";
    const since = searchParams.get("since");

    let where: any = {
      hiddenBy: { none: { userId: user.userId as string } }
    };
    if (tab === "following") {
      const following = await prisma.follows.findMany({
        where: { followerId: user.userId as string },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      where.authorId = { in: followingIds };
    }

    if (since) {
      const sincePost = await prisma.post.findUnique({ where: { id: since } });
      if (sincePost) {
        where.createdAt = { gt: sincePost.createdAt };
      }
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { likes: true, comments: true }
        },
        likes: {
          where: { userId: user.userId as string },
          select: { userId: true }
        },
        bookmarkedBy: {
          where: { userId: user.userId as string },
          select: { userId: true }
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            likes: {
              where: { userId: user.userId as string },
              select: { userId: true }
            }
          }
        },
        repost: {
          include: {
            author: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
      take: 50,
    });

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error("Fetch posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, imageUrl, videoUrl, linkUrl } = await request.json();

    if (!content && !imageUrl && !videoUrl) {
      return NextResponse.json({ error: "Content or media is required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        videoUrl,
        linkUrl,
        authorId: user.userId as string,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
