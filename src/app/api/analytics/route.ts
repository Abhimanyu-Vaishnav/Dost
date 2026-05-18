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
    const postId = searchParams.get("postId");
    const timeframe = searchParams.get("timeframe") || "lifetime";

    let dateFilter: Date | null = null;
    const now = new Date();
    
    switch(timeframe) {
      case "24h":
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "48h":
        dateFilter = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case "7d":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "lifetime":
      default:
        dateFilter = null;
    }

    // Determine the post IDs to filter by
    let postIds = [];
    if (postId && postId !== "all") {
      // Verify ownership
      const post = await prisma.post.findUnique({ where: { id: postId, authorId: user.userId as string }});
      if (!post) return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
      postIds = [postId];
    } else {
      const userPosts = await prisma.post.findMany({ where: { authorId: user.userId as string }, select: { id: true }});
      postIds = userPosts.map(p => p.id);
    }

    if (postIds.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        timeline: [],
        demographics: { region: [], gender: [], device: [], followerStatus: [] }
      });
    }

    const whereClause: any = {
      postId: { in: postIds }
    };
    if (dateFilter) {
      whereClause.createdAt = { gte: dateFilter };
    }

    const views = await prisma.postView.findMany({
      where: whereClause,
      select: { createdAt: true, isFollower: true, region: true, gender: true, device: true },
      orderBy: { createdAt: 'asc' }
    });

    // Aggregations
    let totalViews = views.length;

    // Timeline Aggregation
    const timelineMap = new Map();
    const formatStr = (timeframe === "24h" || timeframe === "48h") ? 'HH:00' : 'MMM dd';
    
    views.forEach(v => {
      // Simple formatting for grouping
      let key;
      if (timeframe === "24h" || timeframe === "48h") {
        const d = new Date(v.createdAt);
        key = `${d.getHours()}:00`;
      } else {
        const d = new Date(v.createdAt);
        key = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
      }
      
      timelineMap.set(key, (timelineMap.get(key) || 0) + 1);
    });

    const timeline = Array.from(timelineMap.entries()).map(([date, count]) => ({ date, views: count }));

    // Demographics Aggregation
    const countBy = (prop: string) => {
      const map = new Map();
      views.forEach(v => {
        const val = (v as any)[prop] || "Unknown";
        map.set(val, (map.get(val) || 0) + 1);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    };

    const demographics = {
      region: countBy('region'),
      gender: countBy('gender'),
      device: countBy('device'),
      followerStatus: [
        { name: "Followers", value: views.filter(v => v.isFollower).length },
        { name: "Non-Followers", value: views.filter(v => !v.isFollower).length }
      ]
    };

    return NextResponse.json({
      totalViews,
      timeline,
      demographics
    });

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
