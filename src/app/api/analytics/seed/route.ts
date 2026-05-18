import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: user.userId as string },
      select: { id: true, views: true }
    });

    if (posts.length === 0) {
      return NextResponse.json({ error: "No posts found to seed" }, { status: 400 });
    }

    const regions = ["North America", "Europe", "Asia", "South America", "Oceania"];
    const genders = ["Male", "Female", "Other"];
    const devices = ["Mobile", "Desktop", "Tablet"];

    const viewsToCreate = [];

    for (const post of posts) {
      // Create random number of views between 20 and 150 per post
      const count = Math.floor(Math.random() * 130) + 20;
      
      for (let i = 0; i < count; i++) {
        // Random date within the last 90 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        date.setHours(date.getHours() - Math.floor(Math.random() * 24));
        
        viewsToCreate.push({
          postId: post.id,
          isFollower: Math.random() > 0.6, // 40% are followers
          region: regions[Math.floor(Math.random() * regions.length)],
          gender: genders[Math.floor(Math.random() * genders.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          createdAt: date
        });
      }
    }

    // Insert in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < viewsToCreate.length; i += BATCH_SIZE) {
      const batch = viewsToCreate.slice(i, i + BATCH_SIZE);
      await prisma.postView.createMany({ data: batch });
    }

    // Update the post view counts to match
    for (const post of posts) {
      const actualCount = await prisma.postView.count({ where: { postId: post.id } });
      await prisma.post.update({
        where: { id: post.id },
        data: { views: actualCount }
      });
    }

    return NextResponse.json({ success: true, count: viewsToCreate.length });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
