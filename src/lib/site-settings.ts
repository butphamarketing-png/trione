"use client";

import { useSyncExternalStore } from "react";

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
  company: "TRIONE.VN",
  slogan: "CHẠY KHI CÒN CÓ THỂ",
  address: "300/41/13A Nguyễn Thái Sơn, Phường Hạnh Thông, TP. Hồ Chí Minh",
  phone: "0705.825.888",
  hotline: "0705.825.888",
  email: "trionevn@outlook.com",
  website: "https://trione.vn",
  hours: "08:00 - 21:00",
  copyright: "Copyright ©2026 Trione.vn.",
  logo: "",
  favicon: "",
  watermark: "",
  facebook: "",
  zalo: "https://zalo.me/0705825888",
  youtube: "",
  instagram: "",
  tiktok: "",
  map: "",
  analytics: "",
  facebookPixel: "",
  webmaster: "",
  headJs: "",
  bodyJs: "",
  seoTitle: "TRIONE.VN — Chương trình thu cũ đồng hồ",
  keywords: "TRIONE.VN, thu cũ, đổi mới, đồng hồ",
  description: "Định giá nhanh, quy trình minh bạch. Thu cũ đổi mới đồng hồ thể thao tại TRIONE.VN.",
  summary: "Thu cũ đổi mới đồng hồ",
  canonical: "https://trione.vn/",
  robots: "index",
  ogSite: "TRIONE.VN",
  ogType: "website",
  ogUrl: "https://trione.vn/",
};

const KEY = "trione-site-settings";
const listeners = new Set<() => void>();
let cache: SiteSettings | null = null;

export type PageSeo = {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
};

const pageListeners = new Set<() => void>();
let pageSeo: PageSeo | null = null;

export function setPageSeo(next: PageSeo | null) {
  pageSeo = next;
  pageListeners.forEach((listener) => listener());
}

export function subscribePageSeo(listener: () => void) {
  pageListeners.add(listener);
  return () => pageListeners.delete(listener);
}

export function readPageSeo() {
  return pageSeo;
}

function normalize(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  const next = { ...defaultSiteSettings, ...(value ?? {}) };
  next.robots = next.robots === "noindex" ? "noindex" : "index";
  return next;
}

export function readSiteSettings(): SiteSettings {
  if (typeof window === "undefined") return defaultSiteSettings;
  if (cache) return cache;
  try {
    const raw = sessionStorage.getItem(KEY);
    cache = normalize(raw ? (JSON.parse(raw) as Partial<SiteSettings>) : null);
  } catch {
    cache = { ...defaultSiteSettings };
  }
  return cache;
}

export function importSiteSettings(raw: string) {
  cache = normalize(JSON.parse(raw) as Partial<SiteSettings>);
  sessionStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((listener) => listener());
  return cache;
}

export function saveSiteSettings(next: SiteSettings) {
  const saved = normalize(next);
  cache = saved;
  sessionStorage.setItem(KEY, JSON.stringify(saved));
  listeners.forEach((listener) => listener());
  void import("@/lib/catalog-sync").then((mod) => mod.publishCatalog());
  return saved;
}

export function subscribeSiteSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSiteSettings() {
  return useSyncExternalStore(subscribeSiteSettings, readSiteSettings, () => defaultSiteSettings);
}

export function phoneHref(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export function facebookPixelId(value: string) {
  const init = value.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{5,20})['"]\s*\)/i);
  if (init) return init[1];
  const digits = value.trim();
  return /^\d{5,20}$/.test(digits) ? digits : "";
}

export function mapEmbedSrc(value: string) {
  const match = value.match(/src=["']([^"']+)["']/i);
  const src = (match?.[1] ?? value).trim();
  if (!/^https:\/\/(www\.)?google\.[a-z.]+\/maps/i.test(src)) return "";
  return src;
}
