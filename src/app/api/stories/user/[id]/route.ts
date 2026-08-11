import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getUserFromRequest(request);
    const currentUserId = currentUser?.userId as string | undefined;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, avatar: true, closeFriendIds: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activeStories = await prisma.story.findMany({
      where: {
        authorId: targetUserId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "asc" }
    });

    // Privacy filtering
    const filteredStories = activeStories.filter((story) => {
      if (story.authorId === currentUserId) return true;
      if (story.privacy === "PUBLIC" || story.privacy === "FRIENDS") return true;

      if (story.privacy === "CLOSE_FRIENDS" && currentUserId) {
        const closeFriendIds: string[] = targetUser.closeFriendIds
          ? JSON.parse(targetUser.closeFriendIds)
          : [];
        return closeFriendIds.includes(currentUserId);
      }

      if (story.privacy === "SPECIFIC" && currentUserId) {
        const allowedUsers: string[] = story.allowedUsers
          ? JSON.parse(story.allowedUsers)
          : [];
        return allowedUsers.includes(currentUserId);
      }

      return false;
    });

    return NextResponse.json({
      hasActiveStory: filteredStories.length > 0,
      user: {
        id: targetUser.id,
        name: targetUser.name || "User",
        avatar: targetUser.avatar
      },
      stories: filteredStories
    });
  } catch (error) {
    console.error("Error fetching user stories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
