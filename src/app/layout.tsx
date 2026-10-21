import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import { SiteDocument } from "@/components/site-document";
import { defaultSiteSettings, googleMeasurementId, googleSiteVerification } from "@/lib/site-defaults";
import { localBusinessJson, siteOrigin } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";
import "./globals.css";

export const dynamic = "force-dynamic";

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
  const google = googleSiteVerification(site.webmaster);
  const origin = siteOrigin(site);
  const title = site.seoTitle || site.company || "Chương trình thu cũ đồng hồ";
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: `%s | ${site.company}` },
    description: site.description,
    keywords: keywords.length ? keywords : undefined,
    robots: site.robots === "noindex" ? { index: false, follow: false } : { index: true, follow: true },
    verification: google ? { google } : undefined,
    openGraph: {
      title,
      description: site.description,
      siteName: site.ogSite || site.company,
      url: site.ogUrl || site.canonical || `${origin}/thu-cu`,
      locale: "vi_VN",
      type: "website",
    },
    twitter: { card: "summary", title, description: site.description },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await readServerSiteSettings();
  const measurementId = googleMeasurementId(site.analytics);
  const structured = JSON.stringify(localBusinessJson(site)).replace(/</g, "\\u003c");
  return (
    <html lang="vi" className={`${beVietnam.variable} ${beVietnam.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structured }} />
        {measurementId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
            <Script id="google-gtag" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`}
            </Script>
          </>
        ) : null}
        <SiteDocument />
        {children}
      </body>
    </html>
  );
}
