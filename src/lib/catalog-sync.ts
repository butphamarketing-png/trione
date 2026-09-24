import { ingestStored } from "@/lib/admin-records";

export const catalogEvent = "trione-catalog";

function kept(key: string) {
  return (
    key.startsWith("trione-admin:") ||
    key.startsWith("trione-staff-profile:") ||
    key === "trione-accounts" ||
    key === "trione-demo-requests" ||
    key === "trione-site-settings"
  );
}

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
      if (!key || !kept(key)) continue;
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
    const keys = Object.keys(payload).filter((key) => kept(key) && payload[key]);
    if (!keys.length) return false;
    for (const key of keys) {
      if (key.startsWith("trione-admin:")) ingestStored(key, payload[key]);
      else sessionStorage.setItem(key, payload[key]);
    }
    const settings = payload["trione-site-settings"];
    if (settings) {
      const site = await import("@/lib/site-settings");
      site.importSiteSettings(settings);
    }
    const requests = payload["trione-demo-requests"];
    if (requests) {
      const orders = await import("@/lib/demo-requests");
      orders.importRequestStore(requests);
    }
    window.dispatchEvent(new Event(catalogEvent));
    return true;
  } catch {
    return false;
  }
}
