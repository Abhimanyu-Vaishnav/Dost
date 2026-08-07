import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    const currentUserId = user?.userId as string | undefined;

    const buildInclude = (userId?: string) => {
      const inc: any = {
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
      };

      if (userId) {
        inc.likes = { where: { userId }, select: { userId: true } };
        inc.reposts = { where: { authorId: userId }, select: { id: true } };
        inc.bookmarkedBy = { where: { userId }, select: { userId: true } };
      }

      return inc;
    };

    // Fetch the target post
    const post = await (prisma.post as any).findUnique({
      where: { id: postId },
      include: buildInclude(currentUserId)
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count asynchronously
    prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } }
    }).catch(() => {});

    // Fetch full thread posts if part of a multi-post thread
    let threadPosts: any[] = [];
    if (post.threadId) {
      threadPosts = await (prisma.post as any).findMany({
        where: { threadId: post.threadId },
        orderBy: { threadPosition: "asc" },
        include: buildInclude(currentUserId)
      }).catch(() => []);
    }

    // Fetch parent chain (ancestors)
    const ancestors: any[] = [];
    let currentParentId = post.parentId;

    while (currentParentId && ancestors.length < 10) {
      const parentPost = await (prisma.post as any).findUnique({
        where: { id: currentParentId },
        include: buildInclude(currentUserId)
      }).catch(() => null);

      if (!parentPost) break;
      ancestors.unshift(parentPost);
      currentParentId = parentPost.parentId;
    }

    // Fetch direct replies to this post
    const replyInclude = {
      ...buildInclude(currentUserId),
      replies: {
        take: 2,
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, avatar: true, username: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }
    };

    const replies = await (prisma.post as any).findMany({
      where: { parentId: postId },
      orderBy: { createdAt: "asc" },
      include: replyInclude
    }).catch(() => []);

    return NextResponse.json({ post, threadPosts, ancestors, replies }, { status: 200 });
  } catch (error: any) {
    console.error("Get post thread error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const resolvedParams = await params;
    const postId = resolvedParams.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
    });

    return NextResponse.json({ post: updatedPost }, { status: 200 });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const postId = resolvedParams.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
