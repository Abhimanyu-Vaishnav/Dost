import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { processPostHashtags } from "@/lib/hashtags";
import { moderateContent } from "@/lib/ai-moderation";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "for-you";
    const hashtag = searchParams.get("hashtag");
    const since = searchParams.get("since");

    let where: any = {
      hiddenBy: { none: { userId: user.userId as string } }
    };

    if (hashtag) {
      where.content = { contains: `#${hashtag}` };
    } else if (tab === "following") {
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

    let posts = await prisma.post.findMany({
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

    // Smart Feed (For You) Algorithmic Ranking: Score = (likes * 3 + comments * 5 + views) / hours_old
    if (tab === "for-you" && posts.length > 0) {
      const now = new Date().getTime();
      posts = posts.sort((a, b) => {
        const ageHoursA = Math.max(0.5, (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
        const ageHoursB = Math.max(0.5, (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60));

        const scoreA = ((a._count.likes * 3) + (a._count.comments * 5) + (a.views || 0)) / Math.pow(ageHoursA, 1.2);
        const scoreB = ((b._count.likes * 3) + (b._count.comments * 5) + (b.views || 0)) / Math.pow(ageHoursB, 1.2);

        return scoreB - scoreA;
      });
    }

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

    const { content, imageUrl, videoUrl, linkUrl, location, pollData, scheduledAt } = await request.json();

    if (!content && !imageUrl && !videoUrl && !pollData) {
      return NextResponse.json({ error: "Content, media, or poll is required" }, { status: 400 });
    }

    // AI Moderation check
    if (content) {
      const modResult = moderateContent(content);
      if (!modResult.allowed) {
        return NextResponse.json({ error: modResult.reason }, { status: 422 });
      }
    }

    const post = await prisma.post.create({
      data: {
        content: content || "",
        imageUrl,
        videoUrl,
        linkUrl,
        location: location || null,
        pollData: pollData ? (typeof pollData === "string" ? pollData : JSON.stringify(pollData)) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        authorId: user.userId as string,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Process hashtags asynchronously
    if (content) {
      await processPostHashtags(content);
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
