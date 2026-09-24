import { brands, garminNew } from "@/data/catalog";
import { normalizeRecord, reindex, type AdminRecord } from "@/lib/admin-records";

export const exchangeStorageKey = "Sản phẩm đổi mới";

const titleIndex = 2;
const parentIndex = 3;
const seriesIndex = 4;
const priceIndex = 5;
const visibleIndex = 6;

export type ExchangeProduct = {
  key: string;
  code: string;
  name: string;
  parent: string;
  brandName: string;
  series: string;
  specs: string;
  price: number;
  image: string;
  face: string;
  strap: string;
  time: string;
  seoTitle: string;
  keywords: string;
  description: string;
};

function money(value: string, fallback = 0) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return fallback;
  return Number(digits);
}

function brandCode(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return brands.find((brand) => brand.id === clean || brand.name === clean)?.id ?? clean;
}

const exchangePhotos: Record<string, string> = {
  "fēnix 8 AMOLED": "/watches/fenix-6x.jpg",
  "fēnix 8 Solar": "/watches/fenix-6x.jpg",
  "fēnix 7 Pro": "/watches/fenix-6x.jpg",
  "Forerunner 970": "/watches/forerunner-970.jpg",
  "Forerunner 570": "/watches/forerunner-265.jpg",
  "Forerunner 265": "/watches/forerunner-265.jpg",
  "Venu 4": "/watches/venu-3.jpg",
  "Venu 3": "/watches/venu-3.jpg",
  "Venu 3S": "/watches/venu-3.jpg",
  "Instinct 3 AMOLED": "/watches/instinct-2-solar.png",
  "Instinct 2X Solar": "/watches/instinct-2-solar.png",
  "Instinct 2S": "/watches/instinct-2s.jpg",
  "vivoactive 6": "/watches/vivoactive.jpg",
  "vivoactive 5": "/watches/vivoactive.jpg",
  "Lily 2 Active": "/watches/instinct-2s.jpg",
  "Lily 2 Classic": "/watches/instinct-2s.jpg",
  "epix Pro Gen 2": "/watches/fenix-6x.jpg",
  "Forerunner 965": "/watches/forerunner-965.jpg",
};

export { exchangePhotos };

function toProduct(item: (typeof garminNew)[number], key = item.id): ExchangeProduct {
  return {
    key,
    code: item.id,
    name: item.name,
    parent: "garmin",
    brandName: "Garmin",
    series: item.series,
    specs: item.specs,
    price: item.listPrice,
    image: exchangePhotos[item.name] || "",
    face: item.face,
    strap: item.strap,
    time: item.time,
    seoTitle: "",
    keywords: "",
    description: "",
  };
}

export function fallbackExchangeProducts(): ExchangeProduct[] {
  return garminNew.map((item) => toProduct(item));
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function readExchangeProducts(parent = ""): ExchangeProduct[] {
  const saved = readSavedExchange();
  const mapped = saved?.length
    ? saved
        .filter((record) => record.cells[visibleIndex] === "✓" && (record.cells[titleIndex] ?? "").trim())
        .map((record) => {
          const name = record.cells[titleIndex].trim();
          const code = (record.extra.sku || "").toLowerCase();
          const known = garminNew.find((item) => item.id === code || item.name === name);
          const parentCode = brandCode(record.extra.category) || brandCode(record.cells[parentIndex] ?? "") || "garmin";
          const brand = brands.find((item) => item.id === parentCode);
          return {
            key: record.id,
            code: code || known?.id || `custom:${record.id}`,
            name,
            parent: parentCode,
            brandName: brand?.name || (record.cells[parentIndex] ?? "").trim() || "Garmin",
            series: (record.cells[seriesIndex] ?? "").trim() || known?.series || "",
            specs: record.extra.shortDesc || plainText(record.extra.description) || known?.specs || "",
            price: money(record.cells[priceIndex] ?? ""),
            image: record.extra.image || "",
            face: known?.face || "#222",
            strap: known?.strap || "#444",
            time: known?.time || "10:09",
            seoTitle: record.extra.seoTitle || "",
            keywords: record.extra.keywords || "",
            description: record.extra.description || "",
          } satisfies ExchangeProduct;
        })
    : fallbackExchangeProducts();
  if (!parent) return mapped;
  return mapped.filter((item) => item.parent === parent);
}

function readSavedExchange() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`trione-admin:${exchangeStorageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRecord[];
    if (!Array.isArray(parsed)) return null;
    return reindex(parsed.map((record, index) => normalizeRecord(record, index)));
  } catch {
    return null;
  }
}
