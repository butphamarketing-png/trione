import { ingestStored } from "@/lib/admin-records";

export const catalogEvent = "trione-catalog";

let publishing = false;
let pending = false;

export async function publishCatalog() {
  if (typeof window === "undefined") return;
  if (publishing) {
    pending = true;
    return;
  }
  publishing = true;
  try {
    const payload: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith("trione-admin:")) continue;
      const raw = sessionStorage.getItem(key);
      if (raw) payload[key] = raw;
    }
    await fetch("/api/catalog", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* keep the local copy */
  } finally {
    publishing = false;
    if (pending) {
      pending = false;
      void publishCatalog();
    }
  }
}

let ready: Promise<boolean> | null = null;

export function ensureCatalog() {
  if (!ready) ready = hydrateCatalog();
  return ready;
}

export async function hydrateCatalog() {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) return false;
    const payload = (await res.json()) as Record<string, string>;
    const keys = Object.keys(payload).filter((key) => key.startsWith("trione-admin:") && payload[key]);
    if (!keys.length) return false;
    for (const key of keys) ingestStored(key, payload[key]);
    window.dispatchEvent(new Event(catalogEvent));
    return true;
  } catch {
    return false;
  }
}
