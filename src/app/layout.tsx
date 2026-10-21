import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { SiteDocument } from "@/components/site-document";
import { defaultSiteSettings } from "@/lib/site-defaults";
import { readServerSiteSettings } from "@/lib/server-site-settings";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await readServerSiteSettings();
  const keywords = (site.keywords || defaultSiteSettings.keywords)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    title: site.seoTitle || site.company || "Chương trình thu cũ đồng hồ",
    description: site.description,
    keywords: keywords.length ? keywords : undefined,
    openGraph: {
      title: site.seoTitle || site.company,
      description: site.description,
      siteName: site.ogSite || site.company,
      url: site.ogUrl || site.canonical || site.website || undefined,
      type: (site.ogType as "website") || "website",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${beVietnam.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteDocument />
        {children}
      </body>
    </html>
  );
}
