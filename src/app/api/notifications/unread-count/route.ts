import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const count = await prisma.notification.count({
      where: {
        userId: user.userId as string,
        isRead: false
      }
    });

    return NextResponse.json({ count }, {
      headers: { "Cache-Control": "private, max-age=1, stale-while-revalidate=5" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
