import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRecord = await prisma.user.findUnique({
      where: { id: currentUser.userId as string },
      select: { closeFriendIds: true }
    });

    const closeFriendIds: string[] = userRecord?.closeFriendIds 
      ? JSON.parse(userRecord.closeFriendIds) 
      : [];

    // Get all users the current user follows or who follow them (eligible to be close friends)
    const following = await prisma.follows.findMany({
      where: { followerId: currentUser.userId as string },
      select: { following: { select: { id: true, name: true, avatar: true } } }
    });

    const followers = await prisma.follows.findMany({
      where: { followingId: currentUser.userId as string },
      select: { follower: { select: { id: true, name: true, avatar: true } } }
    });

    // Merge following and followers to make a unique list of friends
    const friendsMap = new Map<string, { id: string; name: string | null; avatar: string | null }>();
    following.forEach(f => {
      if (f.following) friendsMap.set(f.following.id, f.following);
    });
    followers.forEach(f => {
      if (f.follower) friendsMap.set(f.follower.id, f.follower);
    });

    const eligibleFriends = Array.from(friendsMap.values());

    return NextResponse.json({
      closeFriendIds,
      eligibleFriends
    });
  } catch (error) {
    console.error("Fetch close friends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { closeFriendIds } = await request.json();

    if (!Array.isArray(closeFriendIds)) {
      return NextResponse.json({ error: "closeFriendIds must be an array" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: currentUser.userId as string },
      data: {
        closeFriendIds: JSON.stringify(closeFriendIds)
      }
    });

    return NextResponse.json({ message: "Close friends list updated successfully" });
  } catch (error) {
    console.error("Update close friends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
