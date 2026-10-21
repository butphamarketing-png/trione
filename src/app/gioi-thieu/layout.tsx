import type { Metadata } from "next";
import { siteOrigin } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const site = await readServerSiteSettings();
  const origin = siteOrigin(site);
  const title = "Giới thiệu";
  const description = `${site.company} thu cũ đồng hồ và đổi máy mới. ${site.description}`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${origin}/gioi-thieu` },
    openGraph: { title, description, url: `${origin}/gioi-thieu`, locale: "vi_VN" },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
