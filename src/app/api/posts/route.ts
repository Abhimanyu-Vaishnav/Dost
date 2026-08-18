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
    const excludeRaw = searchParams.get("exclude") || "";
    const excludeIds = excludeRaw ? excludeRaw.split(",").filter(Boolean) : [];

    let where: any = {
      hiddenBy: { none: { userId: user.userId as string } },
      OR: [
        { threadId: null, parentId: null },
        { isThreadStart: true }
      ]
    };

    const category = searchParams.get("category");

    if (hashtag) {
      where.content = { contains: `#${hashtag}`, mode: "insensitive" };
      delete where.OR;
    } else if (category && category !== "all" && category !== "trending") {
      const CATEGORY_KEYWORDS: Record<string, string[]> = {
        technology: ["ai","machine","learning","model","gpt","react","nextjs","javascript","typescript","python","coding","developer","software","tech","app","code"],
        politics: ["election","parliament","government","minister","president","vote","party","bjp","congress","policy","law","modi","gandhi","trump","biden"],
        sports: ["cricket","football","ipl","match","player","team","score","sports","tennis","kabaddi","hockey","messi","ronaldo","rohit","virat"],
        entertainment: ["movie","film","bollywood","netflix","series","actor","actress","music","song","trailer","show","hollywood"],
        business: ["startup","funding","investment","ipo","market","stocks","economy","business","company","ceo","founder","fintech"],
        news: ["news","breaking","today","reported","update","official","announces","statement"],
      };

      const keywords = CATEGORY_KEYWORDS[category];
      if (keywords && keywords.length > 0) {
        where.OR = keywords.map(kw => ({
          content: { contains: kw, mode: "insensitive" as const }
        }));
      }
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

    const skipCount = parseInt(searchParams.get("skip") || "0", 10);
    let takeCount = parseInt(searchParams.get("take") || (searchParams.get("stream") === "true" ? "10" : "20"), 10);

    let posts = await (prisma.post as any).findMany({
      where,
      skip: skipCount,
      take: takeCount,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        linkUrl: true,
        gifUrl: true,
        pollData: true,
        isCodeBlock: true,
        mediaTags: true,
        createdAt: true,
        views: true,
        author: {
          select: { id: true, name: true, avatar: true, username: true }
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, name: true, avatar: true, username: true } }
          }
        },
        quotePost: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, name: true, avatar: true, username: true } }
          }
        },
        _count: {
          select: { likes: true, comments: true, reposts: true }
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
          select: {
            id: true,
            content: true,
            author: { select: { id: true, name: true, avatar: true, username: true } }
          }
        }
      }
    });

    // If stream mode is enabled, fetch un-displayed posts excluding currently visible IDs
    if (searchParams.get("stream") === "true" && (posts.length === 0 || excludeIds.length > 0)) {
      const streamWhere = { ...where };
      delete streamWhere.createdAt;

      if (excludeIds.length > 0) {
        streamWhere.id = { notIn: excludeIds };
      }

      const streamPosts = await (prisma.post as any).findMany({
        where: streamWhere,
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
        take: 12
      });

      if (streamPosts.length > 0) {
        const existingIds = new Set(posts.map((p: any) => p.id));
        const newStreamOnly = streamPosts.filter((sp: any) => !existingIds.has(sp.id));
        posts = [...newStreamOnly, ...posts];
      }
    }

    // Smart Feed (For You) Algorithmic Ranking: Score = (likes * 3 + replies * 5 + views) / hours_old
    if (tab === "for-you" && posts.length > 0) {
      const now = new Date().getTime();
      posts = posts.sort((a: any, b: any) => {
        const ageHoursA = Math.max(0.5, (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
        const ageHoursB = Math.max(0.5, (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60));

        const scoreA = ((a._count.likes * 3) + ((a._count.replies || a._count.comments) * 5) + (a.views || 0)) / Math.pow(ageHoursA, 1.2);
        const scoreB = ((b._count.likes * 3) + ((b._count.replies || b._count.comments) * 5) + (a.views || 0)) / Math.pow(ageHoursB, 1.2);

        return scoreB - scoreA;
      });
    }

    const formattedPosts = posts.map((p: any) => {
      const isLiked = Array.isArray(p.likes) && p.likes.length > 0;
      const isReposted = Array.isArray(p.reposts) && p.reposts.length > 0;
      const isBookmarked = Array.isArray(p.bookmarkedBy) && p.bookmarkedBy.length > 0;
      const likesCount = p._count?.likes ?? 0;
      const repostsCount = p._count?.reposts ?? 0;
      const commentsCount = p._count?.comments ?? 0;

      return {
        ...p,
        isLiked,
        isReposted,
        isBookmarked,
        likesCount,
        repostsCount,
        commentsCount,
        interactions: {
          isLiked,
          likes: likesCount,
          isReposted,
          reposts: repostsCount,
          isBookmarked,
          bookmarks: p._count?.bookmarkedBy ?? 0,
          replies: commentsCount
        }
      };
    });

    return NextResponse.json({ posts: formattedPosts }, { status: 200 });
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

    const body = await request.json();

    // Check if this is a Batch Thread creation request
    if (body.threadPosts && Array.isArray(body.threadPosts) && body.threadPosts.length > 0) {
      const threadId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const createdThreadPosts: any[] = [];

      for (let i = 0; i < body.threadPosts.length; i++) {
        const draft = body.threadPosts[i];
        if (draft.content) {
          const modResult = moderateContent(draft.content);
          if (!modResult.allowed) {
            return NextResponse.json({ error: `Post ${i + 1}: ${modResult.reason}` }, { status: 422 });
          }
        }

        const postData: any = {
          content: draft.content || "",
          authorId: user.userId as string,
          threadId,
          threadPosition: i + 1,
          isThreadStart: i === 0,
        };

        if (draft.imageUrl) postData.imageUrl = draft.imageUrl;
        if (draft.videoUrl) postData.videoUrl = draft.videoUrl;
        if (draft.gifUrl) postData.gifUrl = draft.gifUrl;
        if (draft.location) postData.location = draft.location;

        const created = await (prisma.post as any).create({
          data: postData,
          include: {
            author: { select: { id: true, name: true, avatar: true, username: true } },
            _count: { select: { likes: true, comments: true } },
          },
        });

        if (draft.content) {
          await processPostHashtags(draft.content);
        }

        createdThreadPosts.push(created);
      }

      return NextResponse.json({ post: createdThreadPosts[0], thread: createdThreadPosts }, { status: 201 });
    }

    const {
      content,
      imageUrl,
      videoUrl,
      gifUrl,
      linkUrl,
      location,
      audioUrl,
      pollData,
      scheduledAt,
      parentId,
      quotePostId,
      isCodeBlock,
      threadId,
      threadPosition,
      isThreadStart,
      mediaTags
    } = body;

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
    if (audioUrl) createData.audioUrl = audioUrl;
    if (isCodeBlock) createData.isCodeBlock = true;
    if (mediaTags) createData.mediaTags = typeof mediaTags === "string" ? mediaTags : JSON.stringify(mediaTags);
    if (pollData) createData.pollData = typeof pollData === "string" ? pollData : JSON.stringify(pollData);
    if (scheduledAt) createData.scheduledAt = new Date(scheduledAt);
    if (parentId) createData.parentId = parentId;
    if (quotePostId) createData.quotePostId = quotePostId;
    if (threadId) createData.threadId = threadId;
    if (threadPosition) createData.threadPosition = threadPosition;
    if (isThreadStart) createData.isThreadStart = isThreadStart;

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
      delete createData.location;
      delete createData.gifUrl;
      delete createData.isCodeBlock;
      delete createData.mediaTags;
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
          _count: {
            select: { likes: true, comments: true }
          }
        },
      });
    }

    if (content) {
      await processPostHashtags(content);
    }

    // Process mentions and media tags notifications
    await processMentionsAndMediaTags(post.id, user.userId as string, content, mediaTags);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processMentionsAndMediaTags(postId: string, actorId: string, content?: string, mediaTags?: any) {
  try {
    if (content) {
      const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const usernames = Array.from(new Set(mentionMatches.map(m => m.slice(1))));
        const mentionedUsers = await prisma.user.findMany({
          where: { username: { in: usernames, mode: "insensitive" } },
          select: { id: true }
        });

        for (const u of mentionedUsers) {
          if (u.id !== actorId) {
            await prisma.notification.create({
              data: {
                type: "MENTION",
                userId: u.id,
                actorId,
                postId,
              }
            });
          }
        }
      }
    }

    if (mediaTags) {
      const tagsArray = typeof mediaTags === "string" ? JSON.parse(mediaTags) : mediaTags;
      if (Array.isArray(tagsArray) && tagsArray.length > 0) {
        for (const tag of tagsArray) {
          if (tag.userId && tag.userId !== actorId) {
            await prisma.notification.create({
              data: {
                type: "TAG",
                userId: tag.userId,
                actorId,
                postId,
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error processing mentions/mediaTags:", err);
  }
}
