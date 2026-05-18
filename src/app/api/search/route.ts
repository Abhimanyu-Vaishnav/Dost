import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ users: [], posts: [] }, { status: 200 });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
      },
      take: 10,
    });

    const posts = await prisma.post.findMany({
      where: {
        content: { contains: query },
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users, posts }, { status: 200 });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
