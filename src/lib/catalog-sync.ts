import { ingestStored } from "@/lib/admin-records";

export const catalogEvent = "trione-catalog";
export const catalogErrorEvent = "trione-catalog-error";

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
const HYDRATE_MIN_MS = 25_000;
const PUBLISH_DEBOUNCE_MS = 500;

export function touchCatalogKey(key: string) {
  if (typeof window === "undefined") return;
  const dirty = JSON.parse(sessionStorage.getItem(dirtyStore) || "{}") as Record<string, number>;
  dirty[key] = Date.now();
  sessionStorage.setItem(dirtyStore, JSON.stringify(dirty));
}

let publishTimer: ReturnType<typeof setTimeout> | null = null;
let publishChain: Promise<boolean> = Promise.resolve(true);
let publishAgain = false;
let lastHydrateAt = 0;
let hydrateInFlight: Promise<boolean> | null = null;

async function runPublish() {
  if (typeof window === "undefined") return false;
  let ok = true;
  do {
    publishAgain = false;
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
      payload.__dirty = JSON.stringify(Object.keys(dirty));
      const dirtyAtSend = dirty;
      const res = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        ok = false;
        window.dispatchEvent(new CustomEvent(catalogErrorEvent));
      } else {
        const body = (await res.json().catch(() => ({}))) as { times?: string };
        const serverTimes = JSON.parse(body.times || "{}") as Record<string, number>;
        const latestDirty = JSON.parse(sessionStorage.getItem(dirtyStore) || "{}") as Record<string, number>;
        const knownNow = JSON.parse(sessionStorage.getItem(timeStore) || "{}") as Record<string, number>;
        let pending = false;
        for (const key of Object.keys(dirtyAtSend)) {
          if (Number(latestDirty[key] || 0) > Number(dirtyAtSend[key] || 0)) {
            pending = true;
            continue;
          }
          delete latestDirty[key];
          if (serverTimes[key]) knownNow[key] = Number(serverTimes[key]);
        }
        sessionStorage.setItem(dirtyStore, JSON.stringify(latestDirty));
        sessionStorage.setItem(timeStore, JSON.stringify(knownNow));
        if (pending) publishAgain = true;
        lastHydrateAt = Date.now();
      }
    } catch {
      ok = false;
      window.dispatchEvent(new CustomEvent(catalogErrorEvent));
    }
  } while (publishAgain);
  return ok;
}

function enqueuePublish() {
  publishChain = publishChain.then(runPublish, runPublish);
  return publishChain;
}

export async function publishCatalog() {
  if (typeof window === "undefined") return;
  if (publishTimer) clearTimeout(publishTimer);
  publishTimer = setTimeout(() => {
    publishTimer = null;
    void enqueuePublish();
  }, PUBLISH_DEBOUNCE_MS);
}

/** Cancel debounce and push catalog to the server now (passwords, settings). */
export async function publishCatalogNow() {
  if (typeof window === "undefined") return false;
  if (publishTimer) {
    clearTimeout(publishTimer);
    publishTimer = null;
  }
  publishAgain = true;
  return enqueuePublish();
}

let ready: Promise<boolean> | null = null;

export function ensureCatalog() {
  if (!ready) {
    ready = hydrateCatalog({ force: true }).then((ok) => {
      if (!ok) ready = null;
      return ok;
    });
  }
  return ready;
}

export async function hydrateCatalog(options?: { force?: boolean }) {
  if (typeof window === "undefined") return false;
  const force = Boolean(options?.force);
  if (hydrateInFlight) {
    const pending = await hydrateInFlight;
    if (!force) return pending;
  }
  if (!force && Date.now() - lastHydrateAt < HYDRATE_MIN_MS) return true;

  hydrateInFlight = (async () => {
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) return false;
      const payload = (await res.json()) as Record<string, string>;
      const keys = Object.keys(payload).filter((key) => kept(key) && payload[key]);
      if (!keys.length) {
        lastHydrateAt = Date.now();
        return false;
      }
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
        const current = sessionStorage.getItem(key);
        if (current === payload[key] && Number(known[key] || 0) === serverTime) {
          known[key] = serverTime || known[key] || Date.now();
          if (dirty[key] && dirty[key] <= known[key]) delete dirty[key];
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
      if (applied.size > 0) window.dispatchEvent(new Event(catalogEvent));
      if (keepLocal) void publishCatalogNow();
      lastHydrateAt = Date.now();
      return true;
    } catch {
      return false;
    } finally {
      hydrateInFlight = null;
    }
  })();

  return hydrateInFlight;
}
