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

const timeStore = "trione-catalog-times";
const dirtyStore = "trione-catalog-dirty";

export function touchCatalogKey(key: string) {
  if (typeof window === "undefined") return;
  const dirty = JSON.parse(sessionStorage.getItem(dirtyStore) || "{}") as Record<string, number>;
  dirty[key] = Date.now();
  sessionStorage.setItem(dirtyStore, JSON.stringify(dirty));
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
    const dirty = JSON.parse(sessionStorage.getItem(dirtyStore) || "{}") as Record<string, number>;
    const known = JSON.parse(sessionStorage.getItem(timeStore) || "{}") as Record<string, number>;
    const times: Record<string, number> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !kept(key)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      payload[key] = raw;
      times[key] = dirty[key] || known[key] || 0;
    }
    payload.__times = JSON.stringify(times);
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
  if (!ready) {
    ready = hydrateCatalog().then((ok) => {
      if (!ok) ready = null;
      return ok;
    });
  }
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
    const serverTimes = JSON.parse(payload.__times || "{}") as Record<string, number>;
    const dirty = JSON.parse(sessionStorage.getItem(dirtyStore) || "{}") as Record<string, number>;
    const known = JSON.parse(sessionStorage.getItem(timeStore) || "{}") as Record<string, number>;
    let keepLocal = false;
    const applied = new Set<string>();
    for (const key of keys) {
      const serverTime = Number(serverTimes[key] || 0);
      const localTime = Number(dirty[key] || 0);
      if (sessionStorage.getItem(key) && localTime > serverTime) {
        keepLocal = true;
        continue;
      }
      if (key.startsWith("trione-admin:")) ingestStored(key, payload[key]);
      else sessionStorage.setItem(key, payload[key]);
      applied.add(key);
      known[key] = serverTime || known[key] || Date.now();
      if (dirty[key] && dirty[key] <= known[key]) delete dirty[key];
    }
    sessionStorage.setItem(timeStore, JSON.stringify(known));
    sessionStorage.setItem(dirtyStore, JSON.stringify(dirty));
    if (applied.has("trione-site-settings")) {
      const site = await import("@/lib/site-settings");
      site.importSiteSettings(payload["trione-site-settings"]);
    }
    if (applied.has("trione-demo-requests")) {
      const orders = await import("@/lib/demo-requests");
      orders.importRequestStore(payload["trione-demo-requests"]);
    }
    window.dispatchEvent(new Event(catalogEvent));
    if (keepLocal) void publishCatalog();
    return true;
  } catch {
    return false;
  }
}
