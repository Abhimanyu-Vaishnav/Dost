import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hashtags = await prisma.hashtag.findMany({
      orderBy: { count: "desc" },
      take: 10,
    });

    const topPosts = await prisma.post.findMany({
      take: 10,
      orderBy: { views: "desc" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({ hashtags, topPosts });
  } catch (error) {
    console.error("Fetch trending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
