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
      hiddenBy: { none: { userId: user.userId as string } },
      parentId: null // Main feeds display top-level posts/threads by default
    };

    if (hashtag) {
      where.content = { contains: `#${hashtag}` };
      delete where.parentId; // Hashtag search includes replies
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

    let posts = await (prisma.post as any).findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, username: true }
        },
        parent: {
          include: {
            author: { select: { id: true, name: true, avatar: true, username: true } }
          }
        },
        quotePost: {
          include: {
            author: { select: { id: true, name: true, avatar: true, username: true } }
          }
        },
        _count: {
          select: { likes: true, comments: true, replies: true, reposts: true }
        },
        likes: {
          where: { userId: user.userId as string },
          select: { userId: true }
        },
        reposts: {
          where: { authorId: user.userId as string },
          select: { id: true }
        },
        bookmarkedBy: {
          where: { userId: user.userId as string },
          select: { userId: true }
        },
        repost: {
          include: {
            author: { select: { id: true, name: true, avatar: true, username: true } }
          }
        }
      },
      take: 50,
    });

    // Smart Feed (For You) Algorithmic Ranking: Score = (likes * 3 + replies * 5 + views) / hours_old
    if (tab === "for-you" && posts.length > 0) {
      const now = new Date().getTime();
      posts = posts.sort((a: any, b: any) => {
        const ageHoursA = Math.max(0.5, (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
        const ageHoursB = Math.max(0.5, (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60));

        const scoreA = ((a._count.likes * 3) + ((a._count.replies || a._count.comments) * 5) + (a.views || 0)) / Math.pow(ageHoursA, 1.2);
        const scoreB = ((b._count.likes * 3) + ((b._count.replies || b._count.comments) * 5) + (b.views || 0)) / Math.pow(ageHoursB, 1.2);

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

    const {
      content,
      imageUrl,
      videoUrl,
      gifUrl,
      linkUrl,
      location,
      pollData,
      scheduledAt,
      parentId,
      quotePostId,
      isCodeBlock
    } = await request.json();

    if (!content && !imageUrl && !videoUrl && !gifUrl && !pollData && !quotePostId) {
      return NextResponse.json({ error: "Content, media, GIF, quote, or poll is required" }, { status: 400 });
    }

    // AI Moderation check
    if (content) {
      const modResult = moderateContent(content);
      if (!modResult.allowed) {
        return NextResponse.json({ error: modResult.reason }, { status: 422 });
      }
    }

    const createData: any = {
      content: content || "",
      authorId: user.userId as string,
    };

    if (imageUrl) createData.imageUrl = imageUrl;
    if (videoUrl) createData.videoUrl = videoUrl;
    if (gifUrl) createData.gifUrl = gifUrl;
    if (linkUrl) createData.linkUrl = linkUrl;
    if (location) createData.location = location;
    if (isCodeBlock) createData.isCodeBlock = true;
    if (pollData) createData.pollData = typeof pollData === "string" ? pollData : JSON.stringify(pollData);
    if (scheduledAt) createData.scheduledAt = new Date(scheduledAt);
    if (parentId) createData.parentId = parentId;
    if (quotePostId) createData.quotePostId = quotePostId;

    let post: any;
    try {
      post = await (prisma.post as any).create({
        data: createData,
        include: {
          author: {
            select: { id: true, name: true, avatar: true, username: true }
          },
          parent: {
            include: {
              author: { select: { id: true, name: true, avatar: true, username: true } }
            }
          },
          quotePost: {
            include: {
              author: { select: { id: true, name: true, avatar: true, username: true } }
            }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
      });
    } catch (createErr) {
      console.error("Primary create error, falling back to minimal payload:", createErr);
      // Fallback without extended optional fields
      delete createData.location;
      delete createData.gifUrl;
      delete createData.isCodeBlock;
      post = await (prisma.post as any).create({
        data: createData,
        include: {
          author: {
            select: { id: true, name: true, avatar: true, username: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
      });
    }

    // Send notification if it's a reply to someone else's post
    if (parentId) {
      const parentPost = await prisma.post.findUnique({
        where: { id: parentId },
        select: { authorId: true }
      });
      if (parentPost && parentPost.authorId !== user.userId) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            userId: parentPost.authorId,
            actorId: user.userId as string,
            postId: post.id
          }
        });
      }
    }

    // Send notification if quote posting someone else's post
    if (quotePostId) {
      const quoted = await prisma.post.findUnique({
        where: { id: quotePostId },
        select: { authorId: true }
      });
      if (quoted && quoted.authorId !== user.userId) {
        await prisma.notification.create({
          data: {
            type: "REPOST",
            userId: quoted.authorId,
            actorId: user.userId as string,
            postId: post.id
          }
        });
      }
    }

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
