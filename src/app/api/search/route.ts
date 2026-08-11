import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q");

    if (!rawQuery || !rawQuery.trim()) {
      return NextResponse.json({ users: [], posts: [] }, { status: 200 });
    }

    const query = rawQuery.trim();
    const isUsernameSearch = query.startsWith("@");
    const cleanUsername = isUsernameSearch ? query.slice(1).trim() : query;

    // Search matching users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: cleanUsername, mode: "insensitive" } },
          { username: { contains: cleanUsername, mode: "insensitive" } },
          { email: { contains: cleanUsername, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        accountType: true,
        accountSubType: true
      },
      take: 10,
    });

    // Search matching posts
    // If query starts with @username, filter posts by that user's handle or content
    const postsWhere = isUsernameSearch
      ? {
          OR: [
            { author: { username: { contains: cleanUsername, mode: "insensitive" as const } } },
            { author: { name: { contains: cleanUsername, mode: "insensitive" as const } } },
            { content: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : {
          OR: [
            { content: { contains: query, mode: "insensitive" as const } },
            { author: { name: { contains: query, mode: "insensitive" as const } } },
            { author: { username: { contains: query, mode: "insensitive" as const } } }
          ]
        };

    const posts = await prisma.post.findMany({
      where: postsWhere,
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        likes: true,
        comments: true,
        repost: {
          include: {
            author: { select: { id: true, name: true, username: true, avatar: true } }
          }
        }
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users, posts }, { status: 200 });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
