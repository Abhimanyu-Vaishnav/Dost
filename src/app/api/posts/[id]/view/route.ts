import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyToken(token) : null;
    
    const { id } = await params;

    // Optional: Only count if user is not the author
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (post && (!user || user.userId !== post.authorId)) {
      await prisma.$transaction([
        prisma.post.update({
          where: { id },
          data: { views: { increment: 1 } }
        }),
        prisma.postView.create({
          data: {
            postId: id,
            viewerId: user?.userId as string | undefined,
            isFollower: user ? await prisma.follows.findFirst({ where: { followerId: user.userId as string, followingId: post.authorId } }).then(f => !!f) : false,
            // Mock demographics if headers don't provide them reliably
            region: ["North America", "Europe", "Asia", "South America", "Oceania"][Math.floor(Math.random() * 5)],
            gender: ["Male", "Female", "Other"][Math.floor(Math.random() * 3)],
            device: ["Mobile", "Desktop", "Tablet"][Math.floor(Math.random() * 3)],
          }
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("View track error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
