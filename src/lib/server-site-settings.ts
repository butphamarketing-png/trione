import { readFile } from "fs/promises";
import path from "path";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";

const localFile = path.join(process.cwd(), ".data", "catalog.json");

function normalize(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  const next = { ...defaultSiteSettings, ...(value ?? {}) };
  next.robots = next.robots === "noindex" ? "noindex" : "index";
  return next;
}

/** Read published site settings for SSR metadata (crawlers / first paint). */
export async function readServerSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await readFile(localFile, "utf8");
    const store = JSON.parse(raw) as Record<string, string>;
    const blob = store["trione-site-settings"];
    if (!blob) return { ...defaultSiteSettings };
    return normalize(JSON.parse(blob) as Partial<SiteSettings>);
  } catch {
    return { ...defaultSiteSettings };
  }
}
