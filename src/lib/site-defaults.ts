export type SiteSettings = {
  company: string;
  slogan: string;
  address: string;
  phone: string;
  hotline: string;
  email: string;
  website: string;
  hours: string;
  copyright: string;
  logo: string;
  favicon: string;
  watermark: string;
  facebook: string;
  zalo: string;
  youtube: string;
  instagram: string;
  tiktok: string;
  map: string;
  analytics: string;
  facebookPixel: string;
  webmaster: string;
  headJs: string;
  bodyJs: string;
  seoTitle: string;
  keywords: string;
  description: string;
  summary: string;
  canonical: string;
  robots: "index" | "noindex";
  ogSite: string;
  ogType: string;
  ogUrl: string;
};

export const defaultSiteSettings: SiteSettings = {
  company: "Cửa hàng",
  slogan: "",
  address: "",
  phone: "",
  hotline: "",
  email: "",
  website: "",
  hours: "",
  copyright: "",
  logo: "",
  favicon: "",
  watermark: "",
  facebook: "",
  zalo: "",
  youtube: "",
  instagram: "",
  tiktok: "",
  map: "",
  analytics: "",
  facebookPixel: "",
  webmaster: "",
  headJs: "",
  bodyJs: "",
  seoTitle: "Chương trình thu cũ đồng hồ",
  keywords: "thu cũ, đổi mới, đồng hồ",
  description: "Định giá nhanh, quy trình minh bạch. Thu cũ đổi mới đồng hồ thể thao.",
  summary: "Thu cũ đổi mới đồng hồ",
  canonical: "",
  robots: "index",
  ogSite: "",
  ogType: "website",
  ogUrl: "",
};

export function normalizeSiteSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  const next = { ...defaultSiteSettings, ...(value ?? {}) };
  next.robots = next.robots === "noindex" ? "noindex" : "index";
  for (const key of Object.keys(defaultSiteSettings) as Array<keyof SiteSettings>) {
    if (key === "robots") continue;
    if (typeof next[key] !== "string") next[key] = defaultSiteSettings[key];
  }
  return next;
}
