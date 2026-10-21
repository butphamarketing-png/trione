import type { Metadata } from "next";
import { siteOrigin } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const site = await readServerSiteSettings();
  const origin = siteOrigin(site);
  const title = "Chính sách";
  const description = `Điều khoản, bảo mật, thanh toán, vận chuyển, đổi trả và bảo hành của ${site.company}.`;
  return {
    title,
    description,
    alternates: { canonical: `${origin}/chinh-sach` },
    openGraph: { title, description, url: `${origin}/chinh-sach`, locale: "vi_VN" },
  };
}

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
