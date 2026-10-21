import type { MetadataRoute } from "next";
import { publicPaths, siteOrigin } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin(await readServerSiteSettings());
  return publicPaths().map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === "/thu-cu" ? "daily" : "weekly",
    priority: path === "/thu-cu" ? 1 : path.startsWith("/thu-cu/") ? 0.8 : 0.5,
  }));
}
