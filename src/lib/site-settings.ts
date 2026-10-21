"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/lib/site-defaults";

export type { SiteSettings };
export { defaultSiteSettings };

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
  return normalizeSiteSettings(value);
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
  void import("@/lib/catalog-sync").then((mod) => {
    mod.touchCatalogKey(KEY);
    return mod.publishCatalog();
  });
  return saved;
}

export function subscribeSiteSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let settingsHydrated = false;

function readSettingsSnapshot() {
  if (!settingsHydrated) return defaultSiteSettings;
  return readSiteSettings();
}

export function useSiteSettings() {
  const value = useSyncExternalStore(subscribeSiteSettings, readSettingsSnapshot, () => defaultSiteSettings);
  useEffect(() => {
    settingsHydrated = true;
    listeners.forEach((listener) => listener());
  }, []);
  return value;
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
