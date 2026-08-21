export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, prompt, content, style } = body;

    // 1. SMART REPLY GENERATOR
    if (action === "smart_reply") {
      const text = content || prompt || "";
      const lower = text.toLowerCase();
      let suggestions = ["Sounds good! 👍", "That's awesome! 🔥", "Tell me more! 👀"];

      if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("kaise")) {
        suggestions = ["Hey! All good, you tell? 😊", "Hello! How are you doing? 👋", "Hey there! Good to see you! 🎉"];
      } else if (lower.includes("where") || lower.includes("kaha")) {
        suggestions = ["I'm at work right now 💼", "Just relaxing at home 🏠", "On my way! 🚀"];
      } else if (lower.includes("time") || lower.includes("kab") || lower.includes("when")) {
        suggestions = ["In about 15 mins ⏰", "Later this evening 🌙", "Let's plan for tomorrow! 📅"];
      } else if (lower.includes("call") || lower.includes("phone")) {
        suggestions = ["Free to call now! 📞", "Can I call you in 5 mins? ⏳", "Let me text you back in a bit! 💬"];
      }

      return NextResponse.json({ success: true, suggestions });
    }

    // 2. ENHANCE POST CONTENT
    if (action === "enhance_post") {
      const text = content || prompt || "";
      if (!text) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
      }

      let enhancedText = text;
      const targetStyle = style || "viral";

      if (targetStyle === "viral") {
        enhancedText = `✨ ${text.trim()}\n\nWhat are your thoughts on this? Drop a reply below! 👇🔥`;
      } else if (targetStyle === "professional") {
        enhancedText = `💡 Key Insight:\n\n${text.trim()}\n\n#Professional #Productivity #Growth`;
      } else if (targetStyle === "funny") {
        enhancedText = `Nobody:\nMe: ${text.trim()} 😂💀\n\nWho else relates? 🙋‍♂️`;
      } else if (targetStyle === "concise") {
        enhancedText = `📌 Tldr: ${text.trim()}`;
      }

      return NextResponse.json({ success: true, enhancedText });
    }

    // 3. GENERATE HASHTAGS
    if (action === "hashtags") {
      const text = content || prompt || "";
      const words: string[] = text.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter((w: string) => w.length > 3);
      const uniqueTags: string[] = (Array.from(new Set(words.slice(0, 5))) as string[]).map((w: string) => `#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()}`);
      
      if (uniqueTags.length === 0) {
        uniqueTags.push("#DOST", "#Trending", "#Viral", "#Explore", "#Today");
      } else {
        uniqueTags.push("#DOST", "#Viral");
      }

      return NextResponse.json({ success: true, hashtags: uniqueTags.join(" ") });
    }

    // 4. AI CHATBOT RESPONSE
    if (action === "chat") {
      const userPrompt = prompt || content || "Hello AI";
      const lower = userPrompt.toLowerCase();
      
      let reply = "Hello! I am **DOST AI Companion** 🤖. How can I help you create great posts or connect with friends today?";

      if (lower.includes("who are you") || lower.includes("tum kaun ho") || lower.includes("name")) {
        reply = "I am **DOST AI** 🤖 — your smart social assistant! I can help you write viral posts, suggest smart replies, find trending topics, and chat with you 24/7!";
      } else if (lower.includes("post") || lower.includes("write") || lower.includes("caption")) {
        reply = "Here is a quick post idea for you 🚀:\n\n'Success is built on small daily habits, not sudden breakthroughs. What habit are you working on today? 👇 #Growth #Motivation'";
      } else if (lower.includes("joke") || lower.includes("funny")) {
        reply = "Why don't programmers like nature? It has too many bugs! 😂💻";
      } else if (lower.includes("help") || lower.includes("feature")) {
        reply = "Here's what you can do on DOST 🌟:\n- Host & Join **Live Audio Spaces** 🎙️\n- Make **HD Voice & Video Calls** with recording 📞\n- Play 1v1 **Mini Games in DM** 🎮\n- Share **Voice Notes & Live Polls** 📊";
      } else {
        reply = `That's an awesome topic! Here's a thought on "${userPrompt}": Always stay curious, keep posting cool content on DOST, and engage with your followers! 💫`;
      }

      return NextResponse.json({ success: true, reply });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/ai error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
