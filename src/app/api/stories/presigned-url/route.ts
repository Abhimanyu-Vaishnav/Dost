import { NextResponse, NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType, mediaCategory } = await request.json();

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const extension = fileName ? fileName.split('.').pop() : (fileType.includes("video") ? "mp4" : "jpg");
    const storageKey = `stories/${user.userId}/${uniqueId}.${extension}`;
    const thumbnailKey = `stories/${user.userId}/${uniqueId}_thumb.jpg`;

    // Presigned upload metadata response
    return NextResponse.json({
      uploadUrl: `/api/upload`, // Local upload fallback / S3 presigned endpoint
      storageKey,
      thumbnailKey,
      hlsManifestUrl: fileType?.includes("video") ? `/api/stories/stream/${uniqueId}/manifest.m3u8` : null,
      maxSizeKB: 250,
      aspectRatio: "9:16",
      expiresIn: 3600
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
