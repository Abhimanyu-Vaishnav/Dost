import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Curated trending news topics — simulating a live news feed
const TRENDING_TOPICS = [
  {
    id: "t1",
    category: "Technology",
    topic: "AI takes over software development",
    headline: "Developers say AI writes 40% of their code now",
    posts: 18400,
    isBreaking: true,
  },
  {
    id: "t2",
    category: "India · Trending",
    topic: "#DigitalIndia2026",
    headline: "India crosses 1 billion internet users milestone",
    posts: 9200,
    isBreaking: false,
  },
  {
    id: "t3",
    category: "Entertainment",
    topic: "Bollywood Box Office",
    headline: "Three Indian films cross ₹500 crore in one month",
    posts: 34000,
    isBreaking: false,
  },
  {
    id: "t4",
    category: "Sports",
    topic: "Cricket World Cup 2026",
    headline: "Team India secures quarterfinal spot with record win",
    posts: 72000,
    isBreaking: true,
  },
  {
    id: "t5",
    category: "Business",
    topic: "Startup India Funding",
    headline: "Indian startups raise $2.1B in Series B rounds this quarter",
    posts: 5400,
    isBreaking: false,
  },
  {
    id: "t6",
    category: "Science",
    topic: "ISRO Moon Mission",
    headline: "Chandrayaan-4 launch date confirmed for December 2026",
    posts: 28000,
    isBreaking: true,
  },
  {
    id: "t7",
    category: "Technology · Trending",
    topic: "#DOST",
    headline: "DOST social platform users cross 1 million in beta",
    posts: 4100,
    isBreaking: false,
  },
  {
    id: "t8",
    category: "Health",
    topic: "Mental Health Awareness",
    headline: "India launches national youth mental health hotline",
    posts: 11000,
    isBreaking: false,
  },
];

export async function GET() {
  try {
    // Extract real hashtags from posts in DB
    let posts: { content: string }[] = [];
    try {
      posts = await prisma.post.findMany({
        select: { content: true },
        take: 200,
        orderBy: { createdAt: "desc" }
      });
    } catch (dbErr) {
      // DB may be empty — continue gracefully
    }

    const hashtagCounts: Record<string, number> = {};
    posts.forEach(post => {
      const hashtags = post.content.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach(tag => {
          const cleaned = tag.substring(1).toLowerCase();
          hashtagCounts[cleaned] = (hashtagCounts[cleaned] || 0) + 1;
        });
      }
    });

    const sortedHashtags = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Shuffle topics slightly for freshness
    const shuffledTopics = [...TRENDING_TOPICS].sort(() => Math.random() - 0.3);

    return NextResponse.json(
      {
        trends: sortedHashtags,
        topics: shuffledTopics
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Trends error:", error);
    return NextResponse.json(
      { trends: [], topics: TRENDING_TOPICS },
      { status: 200 }
    );
  }
}
