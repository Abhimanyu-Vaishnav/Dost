import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, action } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt text is required" }, { status: 400 });
    }

    let resultText = prompt;

    // AI Assist Logic & Action Handler
    switch (action) {
      case "hashtags": {
        const words = prompt.split(/\s+/).filter((w: string) => w.length > 3);
        const tags = Array.from(new Set(words.slice(0, 4).map((w: string) => `#${w.toLowerCase().replace(/[^a-z0-9]/g, "")}`)));
        tags.push("#dost", "#buildinpublic", "#trending");
        resultText = `${prompt}\n\n${tags.join(" ")}`;
        break;
      }
      case "polite": {
        resultText = `Hey friends! ${prompt} Looking forward to hearing your thoughts! ✨`;
        break;
      }
      case "professional": {
        resultText = `Announcement: ${prompt}. We appreciate your support as we continue innovating! 🚀`;
        break;
      }
      case "concise": {
        resultText = prompt.length > 100 ? `${prompt.slice(0, 90)}...` : prompt;
        break;
      }
      case "hype": {
        resultText = `🔥 HUGE NEWS! ${prompt.toUpperCase()} 🚀💥 Let's go DOST community! 🔥`;
        break;
      }
      default: {
        resultText = `✨ Enhanced: ${prompt} #DOST`;
        break;
      }
    }

    return NextResponse.json({ success: true, text: resultText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
  }
}
