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

export async function GET(request: any) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ua = request.headers.get("user-agent") || "";
    const currentParsed = parseUserAgent(ua);

    // Dynamic current session detected from user agent
    const currentSession = {
      id: "current-session",
      device: currentParsed.device,
      location: "Active Now • Current Device",
      isCurrent: true,
      icon: currentParsed.icon,
      lastActive: "Active Now"
    };

    return NextResponse.json({
      sessions: [currentSession]
    });
  } catch (error: any) {
    console.error("GET /api/users/sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
