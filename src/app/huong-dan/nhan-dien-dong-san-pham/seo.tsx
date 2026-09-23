"use client";

import { useEffect } from "react";
import { setPageSeo, useSiteSettings } from "@/lib/site-settings";

export function GuideSeo() {
  const site = useSiteSettings();
  useEffect(() => {
    const origin = (site.canonical || site.website || "https://trione.vn").replace(/\/$/, "");
    setPageSeo({
      title: `Cách nhận diện dòng đồng hồ | ${site.company}`,
      description: `Xem mặt lưng, hộp hoặc ứng dụng kết nối để chọn đúng dòng đồng hồ trước khi thu cũ đổi mới tại ${site.company}.`,
      keywords: `nhận diện dòng đồng hồ, Apple Watch, Galaxy Watch, Garmin, thu cũ, ${site.company}`,
      canonical: `${origin}/huong-dan/nhan-dien-dong-san-pham`,
    });
    return () => setPageSeo(null);
  }, [site]);
  return null;
}
