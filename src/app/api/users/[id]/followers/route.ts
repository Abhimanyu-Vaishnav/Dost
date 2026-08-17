import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawTargetId } = await params;
    const currentUser = await getUserFromRequest(request);
    const currentUserId = currentUser?.userId as string | undefined;

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawTargetId },
          { username: { equals: rawTargetId, mode: "insensitive" } }
        ]
      },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = targetUser.id;

    const userSelect = {
      id: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
      accountType: true,
      accountSubType: true
    };

    // 1. Fetch Followers of target user
    const followersRel = await prisma.follows.findMany({
      where: { followingId: targetUserId },
      include: {
        follower: { select: userSelect }
      }
    });

    // 2. Fetch Following of target user
    const followingRel = await prisma.follows.findMany({
      where: { followerId: targetUserId },
      include: {
        following: { select: userSelect }
      }
    });

    const followers = followersRel.map(r => r.follower);
    const following = followingRel.map(r => r.following);

    // 3. Find Mutual Followers (Users who follow target user AND are followed by logged-in current user)
    let mutualFollowers: any[] = [];
    if (currentUserId && currentUserId !== targetUserId) {
      const currentUserFollowing = await prisma.follows.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      const currentUserFollowingSet = new Set(currentUserFollowing.map(f => f.followingId));

      mutualFollowers = followers.filter(u => currentUserFollowingSet.has(u.id));
    }

    // 4. Check follow statuses for all returned users relative to logged-in user
    let loggedInFollowingSet = new Set<string>();
    if (currentUserId) {
      const myFollowing = await prisma.follows.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      loggedInFollowingSet = new Set(myFollowing.map(f => f.followingId));
    }

    const attachStatus = (userList: any[]) =>
      userList.map(u => ({
        ...u,
        isVerified: u.accountType === "PREMIUM" || u.accountType === "VERIFIED",
        isFollowing: loggedInFollowingSet.has(u.id),
        isSelf: currentUserId === u.id
      }));

    return NextResponse.json({
      followers: attachStatus(followers),
      following: attachStatus(following),
      mutualFollowers: attachStatus(mutualFollowers)
    });
  } catch (error) {
    console.error("Error fetching follow relations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
