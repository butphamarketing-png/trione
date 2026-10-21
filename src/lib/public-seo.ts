import type { Metadata } from "next";
import { brands, lines, models } from "@/data/catalog";
import { categorySlug } from "@/lib/level1-categories";
import type { SiteSettings } from "@/lib/site-defaults";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function siteOrigin(site: Pick<SiteSettings, "canonical" | "website">) {
  const raw = (site.canonical || site.website || "https://lendoi.com").trim();
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).origin;
  } catch {
    return "https://lendoi.com";
  }
}

function clip(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

export function tradePathSeo(site: SiteSettings, slug: string[] = []) {
  const origin = siteOrigin(site);
  const [brandSlug, lineSlug, modelSlug] = slug;
  const brand = brands.find((item) => categorySlug(item.id, item.name) === brandSlug || item.id === brandSlug);
  const line = brand && lineSlug ? lines.find((item) => item.brandId === brand.id && (slugify(item.name) === lineSlug || item.id === lineSlug)) : undefined;
  const model = line && modelSlug ? models.find((item) => item.lineId === line.id && (slugify(item.name) === modelSlug || item.id === modelSlug)) : undefined;
  const name = model?.name || line?.name || brand?.name || "";
  const path = ["", "thu-cu", brand ? categorySlug(brand.id, brand.name) : "", line ? slugify(line.name) : "", model ? slugify(model.name) : ""]
    .filter((part, index) => index === 0 || part)
    .join("/");
  const title = name ? `${name} | Thu cũ đổi mới | ${site.company}` : site.seoTitle || site.company;
  const description = clip(
    model?.blurb || model?.specs || line?.blurb || (brand ? `Định giá ${brand.name} cũ và xem máy đổi mới tại ${site.company}. ${site.description}` : site.description),
    160,
  );
  const keywords = [name, brand?.name, "thu cũ", "đổi mới", "đồng hồ", site.company].filter(Boolean).join(", ");
  return { title, description, keywords, canonical: `${origin}${path}` };
}

export function tradeMetadata(site: SiteSettings, slug: string[] = []): Metadata {
  const seo = tradePathSeo(site, slug);
  const absolute = slug.length ? seo.title : site.seoTitle || seo.title;
  return {
    title: { absolute },
    description: seo.description,
    keywords: seo.keywords.split(",").map((item) => item.trim()).filter(Boolean),
    alternates: { canonical: seo.canonical },
    openGraph: {
      title: absolute,
      description: seo.description,
      url: seo.canonical,
      siteName: site.ogSite || site.company,
      locale: "vi_VN",
      type: "website",
    },
  };
}

export function publicPaths() {
  const paths = ["/thu-cu", "/gioi-thieu", "/chinh-sach", "/huong-dan/nhan-dien-dong-san-pham"];
  for (const brand of brands) paths.push(`/thu-cu/${categorySlug(brand.id, brand.name)}`);
  return paths;
}

export function localBusinessJson(site: SiteSettings) {
  const origin = siteOrigin(site);
  const hours = site.hours.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  const sameAs = [site.facebook, site.zalo, site.youtube, site.instagram, site.tiktok].filter((item) => /^https?:\/\//i.test(item));
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.company,
    url: `${origin}/thu-cu`,
    description: site.description,
  };
  if (site.phone) data.telephone = site.phone;
  if (site.address) data.address = { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "VN" };
  if (hours) data.openingHours = `Mo-Su ${hours[1]}-${hours[2]}`;
  if (sameAs.length) data.sameAs = sameAs;
  if (/^https?:\/\//i.test(site.logo)) data.image = site.logo;
  return data;
}
