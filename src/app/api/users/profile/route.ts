import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId as string },
      select: { 
        id: true, name: true, username: true, email: true, avatar: true, coverImage: true, bio: true, gender: true, dob: true, accountType: true, accountSubType: true,
        _count: {
          select: { followers: true, following: true }
        }
      }
    });

    return NextResponse.json({ user: dbUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, username, bio, avatar, coverImage, gender, dob, accountType, accountSubType } = await req.json();
    const userId = user.userId as string;

    let cleanUsername: string | undefined = undefined;
    if (username) {
      cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
      const existing = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          NOT: { id: userId }
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        ...(cleanUsername ? { username: cleanUsername } : {}),
        bio,
        avatar,
        coverImage,
        gender,
        dob: dob ? new Date(dob) : null,
        accountType,
        accountSubType
      }
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
