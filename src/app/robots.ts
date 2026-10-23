import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = siteOrigin(await readServerSiteSettings());
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/nhan-vien", "/dang-nhap", "/api", "/thu-cu"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
