import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const communities = await prisma.community.findMany({
      include: {
        _count: { select: { members: true, posts: true } },
        members: { where: { userId: user.userId as string } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ communities });
  } catch (error) {
    console.error("Fetch communities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description, icon, coverImage } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Community name is required" }, { status: 400 });
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        icon,
        coverImage,
        creatorId: user.userId as string,
        members: {
          create: {
            userId: user.userId as string,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error("Create community error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
