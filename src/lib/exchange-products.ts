import { brands, garminNew } from "@/data/catalog";
import { albumSources, blankExtra, loadRecords, normalizeRecord, saveRecords, shownProductImage, type AdminRecord } from "@/lib/admin-records";
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
  album: string[];
  face: string;
  strap: string;
  time: string;
  serial: string;
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
  "Forerunner 265s": "/watches/forerunner-265.jpg",
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
    album: [],
    face: item.face,
    strap: item.strap,
    time: item.time,
    serial: "",
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
            image: shownProductImage(record.extra.image || exchangePhotos[name] || "", record.extra.album),
            album: albumSources(record.extra.album),
            face: known?.face || "#222",
            strap: known?.strap || "#444",
            time: known?.time || "10:09",
            serial: (record.extra.serial || "").trim(),
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

export function supportSheetRows() {
  const rows = [["mã sản phẩm", "tên sản phẩm", "giá niêm yết", "trợ giá"]];
  for (const item of readExchangeProducts()) {
    rows.push([item.code, item.name, String(item.price), String(item.supportPrice)]);
  }
  return rows;
}

export function supportCsv() {
  return supportSheetRows()
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
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

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

function headerAt(header: string[], test: (value: string) => boolean) {
  return header.findIndex((cell) => test(fold(cell)));
}

export function importSupportRows(rows: string[][]) {
  const clean = rows.filter((row) => row.some((cell) => cell.trim()));
  if (!clean.length) return { updated: 0, missing: [] as string[], skipped: 0 };
  const folded = clean[0].map(fold);
  const hasHeader = folded.some((cell) => /ma san pham|tro gia|sku|^code$/.test(cell));
  const body = hasHeader ? clean.slice(1) : clean;
  const codeAt = hasHeader ? headerAt(clean[0], (value) => /ma san pham|^ma$|sku|^code$/.test(value)) : 0;
  const nameAt = hasHeader ? headerAt(clean[0], (value) => /ten san pham|^ten$|tieu de|^name$/.test(value)) : 1;
  const supportAt = hasHeader
    ? headerAt(clean[0], (value) => /tro gia|ho tro|support/.test(value))
    : (clean[0]?.length ?? 0) >= 4
      ? 3
      : 2;
  if (supportAt < 0) return { updated: 0, missing: ["Không thấy cột trợ giá"], skipped: 0 };

  const records = ensureExchangeRecords();
  const missing: string[] = [];
  let updated = 0;
  let skipped = 0;
  for (const row of body) {
    const code = (row[codeAt] ?? "").trim().toLowerCase();
    const name = nameAt >= 0 ? (row[nameAt] ?? "").trim().toLowerCase() : "";
    const raw = (row[supportAt] ?? "").trim();
    if (!raw) {
      skipped += 1;
      continue;
    }
    const record = records.find((item) => {
      const sku = (item.extra.sku || "").trim().toLowerCase();
      const title = (item.cells[titleIndex] ?? "").trim().toLowerCase();
      return (code && sku === code) || (name && title === name);
    });
    if (!record) {
      missing.push(row[nameAt] || row[codeAt] || "dòng trống");
      continue;
    }
    record.cells[supportIndex] = vndComma(money(raw));
    updated += 1;
  }
  saveRecords(exchangeStorageKey, records);
  return { updated, missing, skipped };
}

export function importSupportCsv(text: string) {
  return importSupportRows(parseCsv(text));
}

function readSavedExchange() {
  return loadRecords(exchangeStorageKey);
}
