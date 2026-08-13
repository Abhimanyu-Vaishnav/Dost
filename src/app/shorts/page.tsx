import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { ShortsFeedClient } from "@/features/shorts/components/ShortsFeedClient";

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback2012.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4"
];

const SAMPLE_CREATORS = [
  { name: "Rohan Varma", username: "rohanv", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
  { name: "Meghna Nair", username: "meghnanair", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { name: "Varun Bajaj", username: "varunbajaj", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150" },
  { name: "Simran Kulkarni", username: "simrank", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  { name: "Nikhil Pandey", username: "nikhil_p", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { name: "Aarav Sharma", username: "aarav_tech", avatar: null },
  { name: "Ananya Gupta", username: "ananya_design", avatar: null }
];

const CAPTIONS = [
  "Completed another 3D motion loop render in Blender! Check out the ambient lighting and refraction effects ✨ #3d #blender #art #design",
  "Just launched another optimization on DOST! Lightning fast response times, smooth glassmorphic UI, and instant notifications 🚀 #tech #dost #buildinpublic",
  "Morning coffee + clean code = unmatched focus 🔥 What tech stack are you using today? #coding #developer #react #nextjs",
  "Quick UI animation breakdown! Notice how subtle physics curves make micro-interactions feel organic 🎨 #uiux #webdesign",
  "Testing new 4K camera setup in the studio 🎥 Let me know what you think of the color grading! #creator #cinematic",
  "High altitude mountain sunset timelapse from Himachal 🏔️ Nature is truly breathtaking #travel #nature #timelapse",
  "Late night debugging session solved after 3 hours! Turns out it was just a missing semi-colon 😅 #programminghumor #devlife",
  "Exploring generative AI prompt engineering for realistic vector icons ✨ #ai #designtech",
  "Building custom audio spaces with real-time WebSockets and Web Audio API 🎙️ #nextjs #fullstack",
  "A quick look into my daily workspace setup 💻 Dual monitors, mechanical keyboard & ambient lights #setup #tech"
];

const AUDIOS = [
  "Original Sound - Rohan Varma",
  "Chill Lofi Beats - DOST Audio",
  "Future Bass Synth Vibe 🚀",
  "Original Sound - Meghna Nair",
  "Acoustic Sunset Melody 🎸",
  "Tech Ambient Soundscapes 💡"
];

export default async function ShortsPage({ searchParams }: { searchParams: Promise<{ postId?: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");
  const user = await verifyToken(token);
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const initialPostId = resolvedParams.postId || null;

  // Fetch real database video posts first
  const dbVideoPosts = await prisma.post.findMany({
    where: { videoUrl: { not: null } },
    include: {
      author: { select: { id: true, name: true, avatar: true, username: true } },
      likes: true,
      comments: true
    },
    take: 50,
    orderBy: { createdAt: "desc" }
  });

  // Generate 60 video posts for infinite scroll testing
  const generatedShorts = Array.from({ length: 60 }).map((_, idx) => {
    const videoUrl = SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length];
    const creator = SAMPLE_CREATORS[idx % SAMPLE_CREATORS.length];
    const caption = CAPTIONS[idx % CAPTIONS.length];
    const audio = AUDIOS[idx % AUDIOS.length];

    return {
      id: `short-gen-${idx + 1}`,
      title: `${caption} (Post #${idx + 1})`,
      videoUrl,
      author: {
        id: `creator-${(idx % SAMPLE_CREATORS.length) + 1}`,
        name: creator.name,
        username: creator.username,
        avatar: creator.avatar,
        isVerified: idx % 2 === 0
      },
      likesCount: Math.floor(Math.random() * 4000) + 120,
      commentsCount: Math.floor(Math.random() * 300) + 15,
      repostsCount: Math.floor(Math.random() * 150) + 5,
      audioTitle: audio
    };
  });

  const dbShorts = dbVideoPosts.map(p => ({
    id: p.id,
    title: p.content,
    videoUrl: p.videoUrl!,
    author: {
      id: p.author.id,
      name: p.author.name,
      username: p.author.username,
      avatar: p.author.avatar,
      isVerified: true
    },
    likesCount: p.likes.length,
    commentsCount: p.comments.length,
    repostsCount: 12,
    audioTitle: `Original Sound - ${p.author.name}`
  }));

  const allShorts = [...dbShorts, ...generatedShorts];

  return (
    <AppLayout fullWidth>
      <ShortsFeedClient shorts={allShorts} initialPostId={initialPostId} />
    </AppLayout>
  );
}
