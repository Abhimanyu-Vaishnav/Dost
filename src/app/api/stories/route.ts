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
          select: { id: true, name: true, avatar: true, closeFriendIds: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // Filter stories based on privacy rules
    const filteredStories = activeStories.filter((story) => {
      // 1. Always allow author to see their own stories
      if (story.authorId === user.userId) return true;

      // 2. Public stories can be seen by anyone
      if (story.privacy === "PUBLIC") return true;

      // 3. People I Follow / Friends privacy: check if viewer is followed by author
      if (story.privacy === "FOLLOWING" || story.privacy === "FRIENDS" || story.privacy === "CLOSE_FRIENDS") {
        return followingIds.includes(story.authorId);
      }

      // 4. Specific privacy: check story's allowedUsers list
      if (story.privacy === "SPECIFIC") {
        const allowedUsers: string[] = story.allowedUsers 
          ? JSON.parse(story.allowedUsers) 
          : [];
        return allowedUsers.includes(user.userId as string);
      }

      return false;
    });

    // Group stories by user
    const groupedStoriesMap = new Map();
    
    filteredStories.forEach(story => {
      if (!groupedStoriesMap.has(story.authorId)) {
        groupedStoriesMap.set(story.authorId, {
          user: {
            id: story.author.id,
            name: story.author.name,
            avatar: story.author.avatar
          },
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

    const { content, mediaUrl, mediaType, musicUrl, overlays, bgColor, privacy, allowedUsers } = await request.json();

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
        privacy: privacy || "PUBLIC",
        allowedUsers: allowedUsers ? JSON.stringify(allowedUsers) : null
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
