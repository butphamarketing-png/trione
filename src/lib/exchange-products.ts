import { brands, garminNew } from "@/data/catalog";
import { blankExtra, normalizeRecord, reindex, saveRecords, type AdminRecord } from "@/lib/admin-records";
import { vndComma } from "@/lib/pricing";

export const exchangeStorageKey = "Sản phẩm đổi mới";

const titleIndex = 2;
const parentIndex = 3;
const seriesIndex = 4;
const priceIndex = 5;
const supportIndex = 6;
const visibleIndex = 7;

export type ExchangeProduct = {
  key: string;
  code: string;
  name: string;
  parent: string;
  brandName: string;
  series: string;
  specs: string;
  price: number;
  supportPrice: number;
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
    supportPrice: 0,
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

export function migrateExchangeRecord(record: AdminRecord): AdminRecord {
  if (record.cells.length !== 7) return record;
  const cells = [...record.cells];
  cells.splice(supportIndex, 0, "0");
  return { ...record, cells };
}

export function readExchangeProducts(parent = ""): ExchangeProduct[] {
  const saved = readSavedExchange();
  const mapped = saved?.length
    ? saved
        .map(migrateExchangeRecord)
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
            supportPrice: money(record.cells[supportIndex] ?? ""),
            image: record.extra.image || exchangePhotos[name] || "",
            face: known?.face || "#222",
            strap: known?.strap || "#444",
            time: known?.time || "10:09",
            seoTitle: record.extra.seoTitle && record.extra.seoTitle !== name ? record.extra.seoTitle : "",
            keywords: record.extra.keywords || "",
            description: record.extra.description || "",
          } satisfies ExchangeProduct;
        })
    : fallbackExchangeProducts();
  if (!parent) return mapped;
  return mapped.filter((item) => item.parent === parent);
}

function csvCell(value: string) {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function supportCsv() {
  const lines = ["mã sản phẩm,tên sản phẩm,giá niêm yết,trợ giá"];
  for (const item of readExchangeProducts()) {
    lines.push([csvCell(item.code), csvCell(item.name), String(item.price), String(item.supportPrice)].join(","));
  }
  return lines.join("\r\n");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  const header = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (header.match(/;/g) || []).length > (header.match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function ensureExchangeRecords() {
  const saved = readSavedExchange();
  if (saved?.length) return saved.map(migrateExchangeRecord);
  return fallbackExchangeProducts().map((item, index) =>
    normalizeRecord(
      {
        id: String(index + 1),
        cells: [String(index + 1), "", item.name, item.brandName, item.series, vndComma(item.price), "0", "✓"],
        extra: { ...blankExtra(String(index + 1)), sku: item.code, category: item.parent, seoTitle: item.name },
      },
      index
    )
  );
}

export function importSupportCsv(text: string) {
  const rows = parseCsv(text);
  const start = /mã|ma san pham|code/i.test(rows[0]?.[0] ?? "") ? 1 : 0;
  const records = ensureExchangeRecords();
  const missing: string[] = [];
  let updated = 0;
  for (const row of rows.slice(start)) {
    const code = (row[0] ?? "").trim().toLowerCase();
    const name = (row[1] ?? "").trim().toLowerCase();
    const support = money(row.length >= 4 ? (row[3] ?? "") : (row[2] ?? ""));
    const record = records.find((item) => {
      const sku = (item.extra.sku || "").trim().toLowerCase();
      const title = (item.cells[titleIndex] ?? "").trim().toLowerCase();
      return (code && sku === code) || (name && title === name);
    });
    if (!record) {
      missing.push(row[1] || row[0] || "dòng trống");
      continue;
    }
    record.cells[supportIndex] = vndComma(support);
    updated += 1;
  }
  saveRecords(exchangeStorageKey, records);
  return { updated, missing };
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
