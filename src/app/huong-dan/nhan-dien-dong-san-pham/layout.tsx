import type { Metadata } from "next";
import { siteOrigin } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const site = await readServerSiteSettings();
  const origin = siteOrigin(site);
  const title = `Cách nhận diện dòng đồng hồ | ${site.company}`;
  const description = `Xem mặt lưng, hộp hoặc ứng dụng kết nối để chọn đúng dòng đồng hồ trước khi thu cũ đổi mới tại ${site.company}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${origin}/huong-dan/nhan-dien-dong-san-pham` },
    openGraph: { title, description, url: `${origin}/huong-dan/nhan-dien-dong-san-pham`, locale: "vi_VN" },
  };
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
