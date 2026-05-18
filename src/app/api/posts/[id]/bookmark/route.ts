import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const postId = resolvedParams.id;
    const userId = user.userId as string;

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: { userId_postId: { userId, postId } },
      });
      return NextResponse.json({ bookmarked: false }, { status: 200 });
    } else {
      await prisma.bookmark.create({
        data: { userId, postId },
      });
      return NextResponse.json({ bookmarked: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
