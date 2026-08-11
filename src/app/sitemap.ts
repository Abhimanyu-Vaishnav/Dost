import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dost-eight.vercel.app";

  const routes = [
    "",
    "/feed",
    "/search",
    "/messages",
    "/notifications",
    "/bookmarks",
    "/lists",
    "/communities",
    "/premium",
    "/analytics",
    "/about",
    "/privacy",
    "/terms",
    "/help",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/feed" || route === "/search" ? "always" : "weekly",
    priority: route === "" || route === "/feed" ? 1.0 : 0.8,
  }));
}
