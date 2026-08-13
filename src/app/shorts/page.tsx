import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { ShortsFeedClient } from "@/features/shorts/components/ShortsFeedClient";

export default async function ShortsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");
  const user = await verifyToken(token);
  if (!user) redirect("/login");

  // Fetch posts that contain video URLs
  const videoPosts = await prisma.post.findMany({
    where: {
      videoUrl: { not: null }
    },
    include: {
      author: { select: { id: true, name: true, avatar: true, username: true } },
      likes: true,
      comments: true
    },
    take: 20,
    orderBy: { createdAt: "desc" }
  });

  // Fallback demo short videos if no video posts exist yet
  const demoShorts = [
    {
      id: "demo-1",
      title: "Building next-generation web app features on DOST! 🚀 #buildinpublic #tech",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      author: {
        id: user.userId as string,
        name: "DOST Official",
        username: "dostapp",
        avatar: null,
        isVerified: true
      },
      likesCount: 1420,
      commentsCount: 89,
      audioTitle: "DOST Original Sound - Tech Vibe"
    },
    {
      id: "demo-2",
      title: "Clean UI animations and smooth dark mode experience in action! ✨ #design #uiux",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      author: {
        id: "creator-2",
        name: "Varun Bajaj",
        username: "varunbajaj",
        avatar: null,
        isVerified: true
      },
      likesCount: 980,
      commentsCount: 45,
      audioTitle: "Original Sound - Varun"
    }
  ];

  const shortsList = videoPosts.length > 0 
    ? videoPosts.map(p => ({
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
        commentsCount: p.comments.length
      }))
    : demoShorts;

  return (
    <AppLayout fullWidth>
      <ShortsFeedClient shorts={shortsList} />
    </AppLayout>
  );
}
