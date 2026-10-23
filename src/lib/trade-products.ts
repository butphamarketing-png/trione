import { brands, lines, models } from "@/data/catalog";
import {
  albumSources,
  blankExtra,
  loadRecords,
  normalizeConditionPrices,
  normalizeGradePrices,
  normalizeRecord,
  saveRecords,
  shownProductImage,
  type AdminRecord,
} from "@/lib/admin-records";
import { level2StorageKey, readLevel2Categories, type Level2Category } from "@/lib/level2-categories";
import { vndComma, type FunctionStatus } from "@/lib/pricing";

export const tradeProductStorageKey = "Danh sách Sản phẩm thu cũ";

const titleIndex = 1;
const visibleIndex = 7;
const priceIndexes = [2, 3, 4, 5, 6];

export type TradeProduct = {
  key: string;
  code: string;
  name: string;
  slug: string;
  parent: string;
  line: string;
  specs: string;
  blurb: string;
  image: string;
  album: string[];
  prices: { 1: number; 2: number; 3: number; 4: number; 5: number };
  gradePrices: number[][];
  screenPrices: number[];
  bodyPrices: number[];
  seoTitle: string;
  keywords: string;
  description: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function money(value: string, fallback = 0) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return fallback;
  return Number(digits);
}

const screenGrade: Record<string, 1 | 2 | 4> = { excellent: 1, light: 2, broken: 4 };
const bodyGrade: Record<string, 1 | 2 | 4> = { excellent: 1, light: 2, heavy: 4 };

export function quoteTradeIn(input: {
  product?: TradeProduct;
  grade: number;
  issueIds?: string[];
  fallback?: TradeProduct["prices"];
  functionStatus?: FunctionStatus;
  screen?: string;
  body?: string;
}) {
  const status = input.functionStatus;
  const stored = (level: 1 | 2 | 3 | 4 | 5) => {
    if (input.product) return input.product.prices[level] || 0;
    return input.fallback?.[level] ?? 0;
  };
  if (status !== "ok" && status !== "issues" && status !== "dead") return 0;
  if (status === "dead") return stored(5);
  if (status === "ok") {
    const screenLevel = input.screen ? screenGrade[input.screen] : undefined;
    const bodyLevel = input.body ? bodyGrade[input.body] : undefined;
    if (!screenLevel || !bodyLevel) return 0;
    return stored(Math.max(screenLevel, bodyLevel) as 1 | 2 | 4);
  }
  const grade = Math.min(5, Math.max(1, input.grade)) as 1 | 2 | 3 | 4 | 5;
  return stored(grade);
}

function brandCode(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return brands.find((brand) => brand.id === clean || brand.name === clean)?.id ?? clean;
}

function lineCode(value: string, saved: Level2Category[] = readLevel2Categories()) {
  const clean = value.trim();
  if (!clean) return "";
  const folded = fold(clean);
  const staticLine = lines.find((line) => fold(line.id) === folded || fold(line.name) === folded);
  const savedLine = saved.find((line) => {
    if (fold(line.code) === folded || fold(line.name) === folded) return true;
    if (!staticLine) return false;
    return fold(line.code) === fold(staticLine.id) || fold(line.name) === fold(staticLine.name);
  });
  return savedLine?.code || staticLine?.id || clean;
}

function onLine(item: { line: string }, line: string) {
  return Boolean(line) && item.line === line;
}

function toProduct(model: (typeof models)[number], key = model.id): TradeProduct {
  const line = lines.find((item) => item.id === model.lineId);
  return {
    key,
    code: model.id,
    name: model.name,
    slug: slugify(model.name),
    parent: line?.brandId ?? "",
    line: model.lineId,
    specs: model.specs,
    blurb: model.blurb,
    image: line?.image || "",
    album: [],
    prices: model.prices,
    gradePrices: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    screenPrices: [0, 0, 0],
    bodyPrices: [0, 0, 0],
    seoTitle: "",
    keywords: "",
    description: "",
  };
}

export function fallbackTradeProducts(line = ""): TradeProduct[] {
  const list = line ? models.filter((model) => model.lineId === line) : models;
  return list.map((model) => toProduct(model));
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function restoreBlankVisibility(saved: AdminRecord[]) {
  let changed = false;
  const next = saved.map((record) => {
    const flag = (record.cells[visibleIndex] ?? "").trim();
    if (flag) return record;
    const priced = priceIndexes.some((index) => money(record.cells[index] ?? "") > 0);
    if (!priced) return record;
    changed = true;
    const cells = record.cells.slice();
    while (cells.length <= visibleIndex) cells.push("");
    cells[visibleIndex] = "✓";
    return { ...record, cells };
  });
  if (!changed) return saved;
  if (typeof window === "undefined") return next;
  return saveRecords(tradeProductStorageKey, next);
}

function retargetOrphanLines(saved: AdminRecord[]) {
  if (typeof window === "undefined" || !loadRecords(level2StorageKey)?.length) return saved;
  const savedLines = readLevel2Categories();
  const codes = new Set(savedLines.map((item) => item.code));
  let changed = false;
  const next = saved.map((record) => {
    const sub = (record.extra.subCategory || "").trim();
    if (!sub || codes.has(sub)) return record;
    const staticLine = lines.find((item) => item.id === sub);
    if (!staticLine) return record;
    const matches = savedLines.filter((item) => item.name === staticLine.name && item.parent === staticLine.brandId);
    if (matches.length !== 1) return record;
    changed = true;
    return { ...record, extra: { ...record.extra, subCategory: matches[0].code } };
  });
  if (!changed) return saved;
  return saveRecords(tradeProductStorageKey, next);
}

export function readTradeProducts(line = ""): TradeProduct[] {
  const loaded = loadRecords(tradeProductStorageKey);
  const saved = loaded?.length ? restoreBlankVisibility(retargetOrphanLines(loaded)) : loaded;
  if (!saved?.length) return fallbackTradeProducts(line);
  const savedLines = readLevel2Categories();
  const mapped = saved
    .filter((record) => {
      const flag = (record.cells[visibleIndex] ?? "").trim();
      if (flag === "✗" || !(record.cells[titleIndex] ?? "").trim()) return false;
      if (flag === "✓") return true;
      return priceIndexes.some((index) => money(record.cells[index] ?? "") > 0);
    })
    .map((record) => {
      const name = record.cells[titleIndex].trim();
      const sku = (record.extra.sku || "").toLowerCase();
      const known = models.find((model) => model.id === sku || model.name === name);
      const code = sku || known?.id || `custom:${record.id}`;
      const productLine = lineCode(record.extra.subCategory, savedLines);
      const parent = brandCode(record.extra.category) || lines.find((item) => item.id === productLine)?.brandId || "";
      return {
        key: record.id,
        code,
        name,
        slug: record.extra.slug || slugify(name),
        parent,
        line: productLine,
        specs: known?.specs || "",
        blurb: record.extra.shortDesc || plainText(record.extra.description) || known?.blurb || "",
        image: shownProductImage(record.extra.image || "", record.extra.album),
        album: albumSources(record.extra.album),
        gradePrices: normalizeGradePrices(record.extra.gradePrices).map((row) => row.map((cell) => money(cell))),
        screenPrices: normalizeConditionPrices(record.extra.screenPrices).map((cell) => money(cell)),
        bodyPrices: normalizeConditionPrices(record.extra.bodyPrices).map((cell) => money(cell)),
        prices: {
          1: money(record.cells[priceIndexes[0]] ?? ""),
          2: money(record.cells[priceIndexes[1]] ?? ""),
          3: money(record.cells[priceIndexes[2]] ?? ""),
          4: money(record.cells[priceIndexes[3]] ?? ""),
          5: money(record.cells[priceIndexes[4]] ?? ""),
        },
        seoTitle: record.extra.seoTitle && record.extra.seoTitle !== name ? record.extra.seoTitle : "",
        keywords: record.extra.keywords || "",
        description: record.extra.description || "",
      } satisfies TradeProduct;
    });
  if (!line) return mapped;
  return mapped.filter((item) => onLine(item, line));
}

function ensureTradeRecords(): AdminRecord[] {
  const saved = loadRecords(tradeProductStorageKey);
  if (saved?.length) return saved.map((record, index) => normalizeRecord(record, index));
  return fallbackTradeProducts().map((item, index) =>
    normalizeRecord(
      {
        id: String(index + 1),
        cells: [
          String(index + 1),
          item.name,
          vndComma(item.prices[1]),
          vndComma(item.prices[2]),
          vndComma(item.prices[3]),
          vndComma(item.prices[4]),
          vndComma(item.prices[5]),
          "✓",
        ],
        extra: {
          ...blankExtra(String(index + 1)),
          sku: item.code,
          category: item.parent,
          subCategory: item.line,
          seoTitle: item.name,
          shortDesc: item.blurb,
        },
      },
      index,
    ),
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

export function tradeSheetRows() {
  const rows = [["mã sản phẩm", "tên sản phẩm", "danh mục cấp 1", "danh mục cấp 2", "giá loại 1", "giá loại 2", "giá loại 3", "giá loại 4", "giá loại 5"]];
  for (const item of readTradeProducts()) {
    rows.push([
      item.code,
      item.name,
      item.parent,
      item.line,
      String(item.prices[1]),
      String(item.prices[2]),
      String(item.prices[3]),
      String(item.prices[4]),
      String(item.prices[5]),
    ]);
  }
  return rows;
}

export type ImportPreviewRow = { action: "create" | "update" | "skip"; label: string; detail: string };

export function importTradePriceRows(rows: string[][], options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const clean = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  if (!clean.length) return { updated: 0, created: 0, missing: [] as string[], skipped: 0, preview: [] as ImportPreviewRow[] };
  const folded = clean[0].map((cell) => fold(String(cell ?? "")));
  const hasHeader = folded.some((cell) => /ma san pham|gia loai|sku|^code$|ten san pham/.test(cell));
  const body = hasHeader ? clean.slice(1) : clean;
  const header = hasHeader ? clean[0].map((cell) => String(cell ?? "")) : [];
  const codeAt = hasHeader ? headerAt(header, (value) => /ma san pham|^ma$|sku|^code$/.test(value)) : 0;
  const nameAt = hasHeader ? headerAt(header, (value) => /ten san pham|^ten$|tieu de|^name$/.test(value)) : 1;
  const catAt = hasHeader ? headerAt(header, (value) => /danh muc cap 1|thuong hieu|brand|parent/.test(value)) : 2;
  const lineAt = hasHeader ? headerAt(header, (value) => /danh muc cap 2|dong san pham|^dong$|line/.test(value)) : 3;
  const p1 = hasHeader ? headerAt(header, (value) => /gia loai 1|loai 1|price 1/.test(value)) : 4;
  const p2 = hasHeader ? headerAt(header, (value) => /gia loai 2|loai 2|price 2/.test(value)) : 5;
  const p3 = hasHeader ? headerAt(header, (value) => /gia loai 3|loai 3|price 3/.test(value)) : 6;
  const p4 = hasHeader ? headerAt(header, (value) => /gia loai 4|loai 4|price 4/.test(value)) : 7;
  const p5 = hasHeader ? headerAt(header, (value) => /gia loai 5|loai 5|price 5/.test(value)) : 8;

  const records = ensureTradeRecords();
  const savedLines = readLevel2Categories();
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
    const category = catAt >= 0 ? brandCode(cells[catAt]) : "";
    const subCategory = lineAt >= 0 ? lineCode(cells[lineAt], savedLines) : "";
    const prices = [p1, p2, p3, p4, p5].map((index) => (index >= 0 ? cells[index] : ""));
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
      if (!nameRaw && !codeRaw) {
        skipped += 1;
        preview.push({ action: "skip", label, detail: "Thiếu mã và tên" });
        continue;
      }
      const title = nameRaw || codeRaw;
      const sku = code || slugify(title);
      preview.push({
        action: "create",
        label: title,
        detail: [sku, category, subCategory].filter(Boolean).join(" · "),
      });
      if (dryRun) {
        created += 1;
        continue;
      }
      record = normalizeRecord(
        {
          id: String(records.length + 1),
          cells: [
            String(records.length + 1),
            title,
            prices[0] ? vndComma(money(prices[0])) : "0",
            prices[1] ? vndComma(money(prices[1])) : "0",
            prices[2] ? vndComma(money(prices[2])) : "0",
            prices[3] ? vndComma(money(prices[3])) : "0",
            prices[4] ? vndComma(money(prices[4])) : "0",
            "✓",
          ],
          extra: {
            ...blankExtra(String(records.length + 1)),
            sku,
            category,
            subCategory,
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
      detail: code || record.extra.sku || "",
    });
    if (dryRun) {
      updated += 1;
      continue;
    }
    if (nameRaw) record.cells[titleIndex] = nameRaw;
    if (codeRaw) record.extra.sku = code;
    if (category) record.extra.category = category;
    if (subCategory) record.extra.subCategory = subCategory;
    prices.forEach((value, index) => {
      if (!value) return;
      record!.cells[priceIndexes[index]] = vndComma(money(value));
    });
    updated += 1;
  }
  if (!dryRun) saveRecords(tradeProductStorageKey, records);
  return { updated, created, missing, skipped, preview };
}
