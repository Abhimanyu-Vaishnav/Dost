import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

let ACTIVE_SPACES = [
  {
    id: "space-1",
    title: "🚀 DOST Tech Talk: Building Next.js Apps & AI Features",
    host: { id: "host-1", name: "Rohan Varma", avatar: null, username: "rohanv" },
    speakersCount: 3,
    listenersCount: 42,
    isLive: true,
    topic: "Tech & Coding"
  },
  {
    id: "space-2",
    title: "🎨 UI/UX Design Trends 2026 & Glassmorphic Themes",
    host: { id: "host-2", name: "Meghna Nair", avatar: null, username: "meghnanair" },
    speakersCount: 2,
    listenersCount: 28,
    isLive: true,
    topic: "Design"
  }
];

export async function GET() {
  return NextResponse.json({ spaces: ACTIVE_SPACES });
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, topic } = await req.json();
    const userNameStr = (user.name as string) || "User";
    const newSpace = {
      id: `space-${Date.now()}`,
      title: title || `${userNameStr}'s Audio Space`,
      host: { id: user.userId as string, name: userNameStr, avatar: null, username: (user.username as string) || "user" },
      speakersCount: 1,
      listenersCount: 1,
      isLive: true,
      topic: topic || "General"
    };

    ACTIVE_SPACES = [newSpace, ...ACTIVE_SPACES];
    return NextResponse.json({ success: true, space: newSpace });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create space" }, { status: 500 });
  }
}
