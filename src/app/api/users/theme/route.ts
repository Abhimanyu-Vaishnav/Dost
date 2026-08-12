import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { themeSettings: true }
    });

    if (!user || !user.themeSettings) {
      return NextResponse.json({ themeSettings: null }, { status: 200 });
    }

    let parsed = null;
    try {
      parsed = JSON.parse(user.themeSettings);
    } catch (e) {
      parsed = null;
    }

    return NextResponse.json({ themeSettings: parsed }, { status: 200 });
  } catch (error) {
    console.error("GET /api/users/theme error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { theme, accentColor, fontSize, fontFamily, reducedMotion } = body;

    const themeObj = {
      theme: theme || "dark",
      accentColor: accentColor || "#1d9bf0",
      fontSize: fontSize || "md",
      fontFamily: fontFamily || "default",
      reducedMotion: !!reducedMotion
    };

    await prisma.user.update({
      where: { id: payload.userId as string },
      data: {
        themeSettings: JSON.stringify(themeObj)
      }
    });

    return NextResponse.json({ success: true, themeSettings: themeObj }, { status: 200 });
  } catch (error) {
    console.error("POST /api/users/theme error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
