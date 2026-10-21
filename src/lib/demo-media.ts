import { readExchangeProducts } from "@/lib/exchange-products";
import { readLevel2Categories } from "@/lib/level2-categories";
import { isMediaSlotId } from "@/lib/media-ids";
import { readTradeProducts } from "@/lib/trade-products";

export type MediaItem = {
  id: string;
  label: string;
  fallback: string;
  usedOn: string;
  group: "site" | "line" | "trade" | "exchange";
};

export { isMediaSlotId } from "@/lib/media-ids";

export const mediaLibrary: MediaItem[] = [
  { id: "login-bg", label: "Banner đăng nhập", fallback: "", usedOn: "Trang đăng nhập", group: "site" },
];

/** Live slots from catalog — same keys wizard uses (`line:`, `model:`, `garmin:`). */
export function buildCatalogMediaLibrary(): MediaItem[] {
  const items: MediaItem[] = [...mediaLibrary];
  const seen = new Set(items.map((item) => item.id));

  for (const line of readLevel2Categories()) {
    const id = `line:${line.code}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      label: line.name,
      fallback: line.image || "",
      usedOn: `Dòng sản phẩm · ${line.parent || "—"}`,
      group: "line",
    });
  }

  for (const product of readTradeProducts()) {
    const id = `model:${product.code}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      label: product.name,
      fallback: product.image || "",
      usedOn: `Thu cũ · ${product.parent || "—"}`,
      group: "trade",
    });
  }

  for (const product of readExchangeProducts()) {
    const id = `garmin:${product.code}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      label: product.name,
      fallback: product.image || "",
      usedOn: `Đổi mới · ${product.brandName || product.parent || "—"}`,
      group: "exchange",
    });
  }

  return items;
}

const KEY = "trione-demo-media";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Record<string, string> = {};

function emit() {
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

function load(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function subscribeMedia(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cachedRaw = undefined;
        onStoreChange();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getMediaSnapshot(): Record<string, string> {
  if (typeof window === "undefined") return emptyMedia;
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = load();
  return cached;
}

const emptyMedia: Record<string, string> = {};

export function getServerMediaSnapshot(): Record<string, string> {
  return emptyMedia;
}

export function mediaSrc(id: string, fallback: string, overrides = getMediaSnapshot()) {
  return overrides[id] || fallback;
}

export function saveMedia(id: string, dataUrl: string) {
  if (!isMediaSlotId(id)) return;
  const next = { ...load(), [id]: dataUrl };
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function replaceMediaMap(map: Record<string, string>) {
  const next: Record<string, string> = {};
  for (const [id, url] of Object.entries(map)) {
    if (url && isMediaSlotId(id)) next[id] = url;
  }
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export async function hydrateMediaFromCloud() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/media", { cache: "no-store" });
    if (!res.ok) return;
    const map = (await res.json()) as Record<string, string>;
    if (map && typeof map === "object") replaceMediaMap(map);
  } catch {
    /* keep local */
  }
}

export function resetMedia(id: string) {
  const next = { ...load() };
  delete next[id];
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

function compressedType() {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  return probe.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
}

export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const type = compressedType();
      resolve(canvas.toDataURL(type, type === "image/webp" ? 0.8 : 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}
