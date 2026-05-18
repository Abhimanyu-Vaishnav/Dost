import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content } = await request.json();

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (comment.userId !== user.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { post: true }
    });

    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Allow deletion if:
    // 1. Own comment
    // 2. Post owner
    const canDelete = comment.userId === user.userId || comment.post.authorId === user.userId;

    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
