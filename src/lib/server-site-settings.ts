import { readFile } from "fs/promises";
import path from "path";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/lib/site-defaults";
import { MEDIA_BUCKET, PRIVATE_BUCKET } from "@/lib/supabase";

const localFile = path.join(process.cwd(), ".data", "catalog.json");
const settingsKey = "trione-site-settings";
const cacheMs = 60_000;

let cache: { at: number; value: SiteSettings } | null = null;

function settingsFromStore(store: Record<string, unknown> | null | undefined): SiteSettings | null {
  const blob = store?.[settingsKey];
  if (typeof blob !== "string" || !blob) return null;
  try {
    return normalizeSiteSettings(JSON.parse(blob) as Partial<SiteSettings>);
  } catch {
    return null;
  }
}

async function readLocalSettings() {
  try {
    const store = JSON.parse(await readFile(localFile, "utf8")) as Record<string, unknown>;
    return settingsFromStore(store);
  } catch {
    return null;
  }
}

async function readBucket(bucket: string, file: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${file}`, {
      headers: { authorization: `Bearer ${key}`, apikey: key },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readRemoteSettings() {
  const stored = await readBucket(PRIVATE_BUCKET, "store.json");
  const fromPrivate = settingsFromStore(stored);
  if (fromPrivate) return fromPrivate;
  const legacy = await readBucket(MEDIA_BUCKET, "catalog/store.json");
  return settingsFromStore(legacy);
}

/** Read published site settings for SSR metadata (crawlers / first paint). */
export async function readServerSiteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < cacheMs) return cache.value;
  const value = (await readLocalSettings()) ?? (await readRemoteSettings()) ?? { ...defaultSiteSettings };
  cache = { at: Date.now(), value };
  return value;
}
