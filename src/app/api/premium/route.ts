import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    const updatedUser = await (prisma.user as any).update({
      where: { id: user.userId },
      data: {
        isVerified: true,
        verificationTier: plan === "gold" ? "GOLD" : "BLUE"
      }
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (e) {
    console.error("Premium upgrade error:", e);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
