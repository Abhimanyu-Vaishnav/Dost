export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export function parseUserAgent(uaString: string) {
  let device = "Desktop PC";
  let icon: "desktop" | "mobile" = "desktop";
  let browser = "Web Browser";

  if (/iPhone/i.test(uaString)) {
    device = "iPhone";
    icon = "mobile";
  } else if (/iPad/i.test(uaString)) {
    device = "iPad";
    icon = "mobile";
  } else if (/Android/i.test(uaString)) {
    device = "Android Device";
    icon = "mobile";
  } else if (/Macintosh|Mac OS X/i.test(uaString)) {
    device = "MacBook / Mac";
    icon = "desktop";
  } else if (/Windows/i.test(uaString)) {
    device = "Windows PC";
    icon = "desktop";
  } else if (/Linux/i.test(uaString)) {
    device = "Linux PC";
    icon = "desktop";
  }

  if (/Chrome/i.test(uaString) && !/Edg/i.test(uaString)) {
    browser = "Chrome Browser";
  } else if (/Safari/i.test(uaString) && !/Chrome/i.test(uaString)) {
    browser = "Safari Browser";
  } else if (/Edg/i.test(uaString)) {
    browser = "Edge Browser";
  } else if (/Firefox/i.test(uaString)) {
    browser = "Firefox Browser";
  } else if (/OPR|Opera/i.test(uaString)) {
    browser = "Opera Browser";
  }

  return { device: `${device} — ${browser}`, icon, rawDevice: device, browser };
}

import bcrypt from "bcryptjs";

export async function GET(request: any) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ua = request.headers.get("user-agent") || "";
    const currentParsed = parseUserAgent(ua);

    // Current session detected from user agent
    const currentSession = {
      id: "current-session",
      device: currentParsed.device,
      location: "Active Now • Current Device",
      isCurrent: true,
      icon: currentParsed.icon,
      lastActive: "Active Now"
    };

    // Database sessions
    let dbSessions: any[] = [];
    try {
      dbSessions = await prisma.userSession.findMany({
        where: { userId: userPayload.userId as string, isBlocked: false },
        orderBy: { lastActive: "desc" }
      });
    } catch (e) {}

    const formattedDbSessions = dbSessions.map(s => {
      const parsed = parseUserAgent(s.userAgent || "");
      return {
        id: s.id,
        device: s.device || parsed.device,
        location: s.isCurrent ? "Active Now • Current Device" : `Last active ${new Date(s.lastActive).toLocaleDateString()}`,
        isCurrent: s.isCurrent,
        icon: parsed.icon
      };
    });

    // Ensure current session is present
    const hasCurrent = formattedDbSessions.some(s => s.isCurrent);
    const sessions = hasCurrent ? formattedDbSessions : [currentSession, ...formattedDbSessions];

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("GET /api/users/sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: any) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, password, action } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required to confirm security authorization" }, { status: 400 });
    }

    // Verify Password
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId as string }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid && password === user.password) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password! Security verification failed." }, { status: 401 });
    }

    // Process Revoke or Block Action
    if (action === "block") {
      try {
        await prisma.userSession.updateMany({
          where: { id: sessionId, userId: user.id },
          data: { isBlocked: true }
        });
      } catch (e) {}
    } else {
      try {
        await prisma.userSession.deleteMany({
          where: { id: sessionId, userId: user.id }
        });
      } catch (e) {}
    }

    return NextResponse.json({
      message: action === "block" ? "Device session blocked successfully" : "Device session revoked & logged out successfully",
      success: true
    });
  } catch (error: any) {
    console.error("POST /api/users/sessions error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
