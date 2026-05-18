import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get users the current user follows
    const following = await prisma.follows.findMany({
      where: { followerId: user.userId as string },
      select: { followingId: true },
    });
    
    const followingIds = following.map((f) => f.followingId);
    
    // Include current user's own stories
    const authorIds = [...followingIds, user.userId as string];

    const activeStories = await prisma.story.findMany({
      where: {
        authorId: { in: authorIds },
        expiresAt: { gt: new Date() }
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // Group stories by user
    const groupedStoriesMap = new Map();
    
    activeStories.forEach(story => {
      if (!groupedStoriesMap.has(story.authorId)) {
        groupedStoriesMap.set(story.authorId, {
          user: story.author,
          stories: []
        });
      }
      groupedStoriesMap.get(story.authorId).stories.push(story);
    });

    // Convert map to array and put current user first if they have a story
    let groupedStoriesArray = Array.from(groupedStoriesMap.values());
    
    const currentUserIndex = groupedStoriesArray.findIndex(g => g.user.id === user.userId);
    if (currentUserIndex > 0) {
      const currentUserGroup = groupedStoriesArray.splice(currentUserIndex, 1)[0];
      groupedStoriesArray.unshift(currentUserGroup);
    }

    return NextResponse.json({ groupedStories: groupedStoriesArray }, { status: 200 });
  } catch (error) {
    console.error("Fetch stories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, mediaUrl, mediaType, musicUrl, overlays, bgColor } = await request.json();

    if (!content && !mediaUrl && !bgColor) {
      return NextResponse.json({ error: "Content, media, or background color is required" }, { status: 400 });
    }

    // Story expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        content,
        mediaUrl,
        mediaType: mediaType || "TEXT",
        musicUrl,
        overlays: overlays ? JSON.stringify(overlays) : null,
        bgColor,
        expiresAt,
        authorId: user.userId as string,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("Create story error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
