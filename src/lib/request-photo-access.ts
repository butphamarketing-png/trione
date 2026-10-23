import { readFile } from "fs/promises";
import path from "path";
import { requests as seededRequests } from "@/data/staff";
import { requestIdFromPhoto } from "@/lib/media-ids";
import { PRIVATE_BUCKET } from "@/lib/supabase";

const localFile = path.join(process.cwd(), ".data", "catalog.json");

type RequestRow = { id?: string; username?: string };
type RequestStore = {
  extra?: RequestRow[];
  overrides?: Record<string, { username?: string }>;
  removed?: string[];
};

function ownerInStore(raw: string, requestId: string) {
  try {
    const parsed = JSON.parse(raw || "{}") as RequestStore;
    if ((parsed.removed || []).map(String).includes(requestId)) return "";
    const extra = (parsed.extra || []).find((item) => item?.id === requestId);
    const seeded = seededRequests.find((item) => item.id === requestId);
    const base = extra || seeded;
    if (!base) return "";
    return (parsed.overrides?.[requestId]?.username || base.username || "").trim();
  } catch {
    return null;
  }
}

async function requestStoreRaw() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (base && key) {
    try {
      const res = await fetch(`${base}/storage/v1/object/${PRIVATE_BUCKET}/store.json?t=${Date.now()}`, {
        headers: { authorization: `Bearer ${key}`, apikey: key },
        cache: "no-store",
      });
      if (res.ok) {
        const store = (await res.json()) as Record<string, string>;
        return store["trione-demo-requests"] || "";
      }
    } catch {
      /* use the local copy */
    }
  }
  try {
    const store = JSON.parse(await readFile(localFile, "utf8")) as Record<string, string>;
    return store["trione-demo-requests"] || "";
  } catch {
    return null;
  }
}

export async function requestPhotoOwner(photoId: string) {
  const requestId = requestIdFromPhoto(photoId);
  if (!requestId) return null;
  const raw = await requestStoreRaw();
  if (raw === null) return null;
  return ownerInStore(raw, requestId);
}
