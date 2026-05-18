import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      select: { content: true },
      take: 100 // Look at last 100 posts
    });

    const hashtagCounts: Record<string, number> = {};
    
    posts.forEach(post => {
      const hashtags = post.content.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach(tag => {
          const cleaned = tag.substring(1);
          hashtagCounts[cleaned] = (hashtagCounts[cleaned] || 0) + 1;
        });
      }
    });

    const sortedTrends = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({ trends: sortedTrends }, { status: 200 });
  } catch (error) {
    console.error("Trends error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
