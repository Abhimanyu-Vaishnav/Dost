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

    const existingHidden = await prisma.hiddenPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingHidden) {
      return NextResponse.json({ message: "Post already hidden" }, { status: 200 });
    }

    await prisma.hiddenPost.create({
      data: { userId, postId },
    });

    return NextResponse.json({ message: "Post hidden" }, { status: 200 });
  } catch (error) {
    console.error("Hide error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
