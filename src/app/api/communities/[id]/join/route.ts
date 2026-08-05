import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: communityId } = await params;

    const existing = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: user.userId as string,
        },
      },
    });

    if (existing) {
      await prisma.communityMember.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ joined: false });
    } else {
      await prisma.communityMember.create({
        data: {
          communityId,
          userId: user.userId as string,
        },
      });
      return NextResponse.json({ joined: true });
    }
  } catch (error) {
    console.error("Community join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
