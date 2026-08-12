import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter required" }, { status: 400 });
    }

    const highlights = await prisma.storyHighlight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error("Fetch highlights error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, coverImage, storyIds } = await request.json();

    if (!title || !storyIds || !Array.isArray(storyIds)) {
      return NextResponse.json({ error: "Title and storyIds array are required" }, { status: 400 });
    }


    const highlight = await prisma.storyHighlight.create({
      data: {
        userId: user.userId as string,
        title,
        coverImage: coverImage || null,
        storyIds: JSON.stringify(storyIds)
      }
    });

    return NextResponse.json({ highlight }, { status: 201 });
  } catch (error) {
    console.error("Create highlight error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
