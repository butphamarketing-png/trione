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

export function exchangeSheetRows() {
  const rows = [["mã sản phẩm", "tên sản phẩm", "danh mục cấp 1", "series", "giá niêm yết", "trợ giá"]];
  for (const item of readExchangeProducts()) {
    rows.push([item.code, item.name, item.parent, item.series, String(item.price), String(item.supportPrice)]);
  }
  return rows;
}

function slugifySku(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ImportPreviewRow = { action: "create" | "update" | "skip"; label: string; detail: string };

export function importExchangePriceRows(rows: string[][], options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const clean = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  if (!clean.length) return { updated: 0, created: 0, missing: [] as string[], skipped: 0, preview: [] as ImportPreviewRow[] };
  const folded = clean[0].map((cell) => fold(String(cell ?? "")));
  const hasHeader = folded.some((cell) => /ma san pham|gia niem yet|tro gia|sku|^code$|ten san pham/.test(cell));
  const body = hasHeader ? clean.slice(1) : clean;
  const header = hasHeader ? clean[0].map((cell) => String(cell ?? "")) : [];
  const codeAt = hasHeader ? headerAt(header, (value) => /ma san pham|^ma$|sku|^code$/.test(value)) : 0;
  const nameAt = hasHeader ? headerAt(header, (value) => /ten san pham|^ten$|tieu de|^name$/.test(value)) : 1;
  const catAt = hasHeader ? headerAt(header, (value) => /danh muc cap 1|thuong hieu|brand|parent/.test(value)) : 2;
  const seriesAt = hasHeader ? headerAt(header, (value) => /series|dong may|^dong$/.test(value)) : 3;
  const priceAt = hasHeader
    ? headerAt(header, (value) => /gia niem yet|list price|^gia$|price/.test(value) && !/tro gia|loai/.test(value))
    : 4;
  const supportAt = hasHeader ? headerAt(header, (value) => /tro gia|ho tro|support/.test(value)) : 5;

  const records = ensureExchangeRecords();
  const missing: string[] = [];
  const preview: ImportPreviewRow[] = [];
  let updated = 0;
  let created = 0;
  let skipped = 0;
  for (const row of body) {
    const cells = row.map((cell) => String(cell ?? "").trim());
    const codeRaw = codeAt >= 0 ? cells[codeAt] : "";
    const nameRaw = nameAt >= 0 ? cells[nameAt] : "";
    const code = codeRaw.toLowerCase();
    const name = nameRaw.toLowerCase();
    const categoryRaw = catAt >= 0 ? cells[catAt] : "";
    const parentCode = brandCode(categoryRaw) || "garmin";
    const brand = brands.find((item) => item.id === parentCode);
    const brandLabel = brand?.name || categoryRaw || "Garmin";
    const series = seriesAt >= 0 ? cells[seriesAt] : "";
    const priceRaw = priceAt >= 0 ? cells[priceAt] : "";
    const supportRaw = supportAt >= 0 ? cells[supportAt] : "";
    const label = nameRaw || codeRaw || "dòng trống";
    if (!code && !name) {
      skipped += 1;
      preview.push({ action: "skip", label, detail: "Thiếu mã và tên" });
      continue;
    }
    let record = records.find((item) => {
      const sku = (item.extra.sku || "").trim().toLowerCase();
      const title = (item.cells[titleIndex] ?? "").trim().toLowerCase();
      return (code && sku === code) || (name && title === name);
    });
    if (!record) {
      const title = nameRaw || codeRaw;
      const sku = code || slugifySku(title);
      preview.push({ action: "create", label: title, detail: [sku, brandLabel, series].filter(Boolean).join(" · ") });
      if (dryRun) {
        created += 1;
        continue;
      }
      record = normalizeRecord(
        {
          id: String(records.length + 1),
          cells: [
            String(records.length + 1),
            "",
            title,
            brandLabel,
            series,
            priceRaw ? vndComma(money(priceRaw)) : "0",
            supportRaw ? vndComma(money(supportRaw)) : "0",
            "✓",
          ],
          extra: {
            ...blankExtra(String(records.length + 1)),
            sku,
            category: parentCode,
            seoTitle: title,
          },
        },
        records.length,
      );
      records.push(record);
      created += 1;
      continue;
    }
    preview.push({
      action: "update",
      label: nameRaw || record.cells[titleIndex] || codeRaw,
      detail: [code || record.extra.sku, brandLabel, series].filter(Boolean).join(" · "),
    });
    if (dryRun) {
      updated += 1;
      continue;
    }
    if (nameRaw) record.cells[titleIndex] = nameRaw;
    if (codeRaw) record.extra.sku = code;
    if (categoryRaw) {
      record.extra.category = parentCode;
      record.cells[parentIndex] = brandLabel;
    }
    if (series) record.cells[seriesIndex] = series;
    if (priceRaw) record.cells[priceIndex] = vndComma(money(priceRaw));
    if (supportRaw) record.cells[supportIndex] = vndComma(money(supportRaw));
    updated += 1;
  }
  if (!dryRun) saveRecords(exchangeStorageKey, records);
  return { updated, created, missing, skipped, preview };
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

export function importSupportRows(rows: string[][], options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const clean = rows.filter((row) => row.some((cell) => cell.trim()));
  if (!clean.length) return { updated: 0, created: 0, missing: [] as string[], skipped: 0, preview: [] as ImportPreviewRow[] };
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
  if (supportAt < 0) {
    return { updated: 0, created: 0, missing: ["Không thấy cột trợ giá"], skipped: 0, preview: [] as ImportPreviewRow[] };
  }

  const records = ensureExchangeRecords();
  const missing: string[] = [];
  const preview: ImportPreviewRow[] = [];
  let updated = 0;
  let skipped = 0;
  for (const row of body) {
    const code = (row[codeAt] ?? "").trim().toLowerCase();
    const name = nameAt >= 0 ? (row[nameAt] ?? "").trim().toLowerCase() : "";
    const raw = (row[supportAt] ?? "").trim();
    const label = row[nameAt] || row[codeAt] || "dòng trống";
    if (!raw) {
      skipped += 1;
      preview.push({ action: "skip", label, detail: "Ô trợ giá trống" });
      continue;
    }
    const record = records.find((item) => {
      const sku = (item.extra.sku || "").trim().toLowerCase();
      const title = (item.cells[titleIndex] ?? "").trim().toLowerCase();
      return (code && sku === code) || (name && title === name);
    });
    if (!record) {
      missing.push(label);
      preview.push({ action: "skip", label, detail: "Không khớp sản phẩm" });
      continue;
    }
    preview.push({ action: "update", label, detail: `trợ giá → ${raw}` });
    if (dryRun) {
      updated += 1;
      continue;
    }
    record.cells[supportIndex] = vndComma(money(raw));
    updated += 1;
  }
  if (!dryRun) saveRecords(exchangeStorageKey, records);
  return { updated, created: 0, missing, skipped, preview };
}

export function importSupportCsv(text: string, options?: { dryRun?: boolean }) {
  return importSupportRows(parseCsv(text), options);
}

function readSavedExchange() {
  return loadRecords(exchangeStorageKey);
}
