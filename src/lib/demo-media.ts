export type MediaItem = {
  id: string;
  label: string;
  fallback: string;
  usedOn: string;
};

export const mediaLibrary: MediaItem[] = [
  { id: "login-bg", label: "Banner đăng nhập", fallback: "/login-bg.png", usedOn: "Trang đăng nhập" },
  { id: "line:ultra", label: "Apple Watch Ultra", fallback: "/watches/line-ultra.png", usedOn: "Wizard · dòng máy" },
  { id: "line:series", label: "Apple Watch Series", fallback: "/watches/line-series.png", usedOn: "Wizard · dòng máy" },
  { id: "line:se", label: "Apple Watch SE", fallback: "/watches/line-se.png", usedOn: "Wizard · dòng máy" },
  { id: "model:ultra2", label: "Ultra 2", fallback: "/watches/model-ultra2.png", usedOn: "Wizard · mẫu thu cũ" },
  { id: "model:ultra1", label: "Ultra 1", fallback: "/watches/model-ultra1.png", usedOn: "Wizard · mẫu thu cũ" },
  { id: "garmin:fenix8", label: "fēnix 8 AMOLED", fallback: "/watches/g-fenix.png", usedOn: "Wizard · đổi mới" },
  { id: "garmin:fr970", label: "Forerunner 970", fallback: "/watches/g-fr970.png", usedOn: "Wizard · đổi mới" },
];

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
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = load();
  return cached;
}

export function getServerMediaSnapshot(): Record<string, string> {
  return {};
}

export function mediaSrc(id: string, fallback: string, overrides = getMediaSnapshot()) {
  return overrides[id] || fallback;
}

export function saveMedia(id: string, dataUrl: string) {
  const next = { ...load(), [id]: dataUrl };
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function replaceMediaMap(map: Record<string, string>) {
  const next: Record<string, string> = {};
  for (const item of mediaLibrary) {
    if (map[item.id]) next[item.id] = map[item.id];
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
