import { prisma } from "@/lib/prisma";

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  const tags = matches.map((tag) => tag.slice(1).toLowerCase());
  return Array.from(new Set(tags));
}

export async function processPostHashtags(content: string) {
  const tags = extractHashtags(content);
  if (tags.length === 0) return;

  for (const tag of tags) {
    await prisma.hashtag.upsert({
      where: { name: tag },
      update: { count: { increment: 1 } },
      create: { name: tag, count: 1 },
    });
  }
}
