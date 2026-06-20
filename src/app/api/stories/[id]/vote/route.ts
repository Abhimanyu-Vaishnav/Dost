import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { id: storyId } = resolvedParams;
    const { overlayId, optionIndex } = await request.json();

    if (optionIndex === undefined || !overlayId) {
      return NextResponse.json({ error: "overlayId and optionIndex are required" }, { status: 400 });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { overlays: true }
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    let overlaysList: any[] = [];
    if (story.overlays) {
      overlaysList = JSON.parse(story.overlays);
    }

    let updated = false;
    overlaysList = overlaysList.map((overlay: any) => {
      if (overlay.id === overlayId && overlay.type === "POLL") {
        const votes = overlay.votes || [0, 0];
        const votedUserIds = overlay.votedUserIds || {};

        // If user already voted, check if they are changing their vote
        const existingVoteIndex = votedUserIds[user.userId as string];
        if (existingVoteIndex !== undefined) {
          if (existingVoteIndex === optionIndex) {
            // Voted for same option, do nothing
            return overlay;
          }
          // Remove previous vote
          votes[existingVoteIndex] = Math.max(0, votes[existingVoteIndex] - 1);
        }

        // Add new vote
        votes[optionIndex] = (votes[optionIndex] || 0) + 1;
        votedUserIds[user.userId as string] = optionIndex;

        updated = true;
        return {
          ...overlay,
          votes,
          votedUserIds
        };
      }
      return overlay;
    });

    if (!updated) {
      return NextResponse.json({ error: "Poll overlay not found" }, { status: 404 });
    }

    // Save back to db
    await prisma.story.update({
      where: { id: storyId },
      data: {
        overlays: JSON.stringify(overlaysList)
      }
    });

    return NextResponse.json({ overlays: overlaysList });
  } catch (error) {
    console.error("Vote poll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
