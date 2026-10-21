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

const brandTextKeys: Array<keyof SiteSettings> = [
  "company",
  "slogan",
  "address",
  "phone",
  "hotline",
  "email",
  "website",
  "hours",
  "copyright",
  "facebook",
  "zalo",
  "youtube",
  "instagram",
  "tiktok",
  "seoTitle",
  "keywords",
  "description",
  "summary",
  "canonical",
  "ogSite",
  "ogUrl",
];

function stripLegacyBrand(value: string) {
  return value
    .replace(/https?:\/\/(www\.)?trione\.vn\/?/gi, "")
    .replace(/trione\.vn/gi, "")
    .replace(/trionevn/gi, "")
    .replace(/\btrione\b/gi, "")
    .replace(/\s+tại\s*\.?$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;|])/g, "$1")
    .replace(/^[,\s|—–-]+|[,\s|—–-]+$/g, "")
    .trim();
}

export function normalizeSiteSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  const next = { ...defaultSiteSettings, ...(value ?? {}) };
  next.robots = next.robots === "noindex" ? "noindex" : "index";
  for (const key of Object.keys(defaultSiteSettings) as Array<keyof SiteSettings>) {
    if (key === "robots") continue;
    if (typeof next[key] !== "string") next[key] = defaultSiteSettings[key];
  }
  for (const key of brandTextKeys) {
    next[key] = stripLegacyBrand(next[key]);
  }
  if (!next.company) next.company = defaultSiteSettings.company;
  if (!next.seoTitle) next.seoTitle = defaultSiteSettings.seoTitle;
  if (!next.description) next.description = defaultSiteSettings.description;
  if (!next.keywords) next.keywords = defaultSiteSettings.keywords;
  if (/^copyright\s*©?\s*\d{4}\.?$/i.test(next.copyright)) next.copyright = "";
  if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) next.email = "";
  if (next.website && !/^https?:\/\//i.test(next.website)) next.website = "";
  if (next.canonical && !/^https?:\/\//i.test(next.canonical)) next.canonical = "";
  if (next.ogUrl && !/^https?:\/\//i.test(next.ogUrl)) next.ogUrl = "";
  return next;
}
