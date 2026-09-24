import { brands, lines, models } from "@/data/catalog";
import { normalizeConditionPrices, normalizeGradePrices, normalizeRecord, reindex, type AdminRecord } from "@/lib/admin-records";
import type { FunctionStatus } from "@/lib/pricing";

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

const issueOrder = ["hr", "gps", "spo2", "other"];
const screenOrder = ["excellent", "light", "broken"];
const bodyOrder = ["excellent", "light", "heavy"];
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
  const status = input.functionStatus ?? "ok";
  const grade = Math.min(5, Math.max(1, input.grade)) as 1 | 2 | 3 | 4 | 5;
  const product = input.product;
  const stored = (level: 1 | 2 | 3 | 4 | 5) => {
    if (product) return product.prices[level] || 0;
    return input.fallback?.[level] ?? 0;
  };
  if (status === "dead") return stored(5);
  if (status === "ok") return conditionQuote(product, input.fallback, input.screen, input.body);
  const level = Math.min(4, grade) as 1 | 2 | 3 | 4;
  const row = product?.gradePrices[level - 1] ?? [];
  const picked = (input.issueIds ?? [])
    .map((id) => issueOrder.indexOf(id))
    .filter((index) => index >= 0)
    .map((index) => row[index] ?? 0)
    .filter((amount) => amount > 0);
  if (picked.length) return Math.min(...picked);
  return stored(grade);
}

export function conditionAmount(product: TradeProduct | undefined, kind: "screen" | "body", id: string) {
  const level = (kind === "screen" ? screenGrade[id] : bodyGrade[id]) ?? 1;
  const list = kind === "screen" ? product?.screenPrices : product?.bodyPrices;
  const order = kind === "screen" ? screenOrder : bodyOrder;
  const specific = list?.[order.indexOf(id)] ?? 0;
  if (specific > 0) return specific;
  return product?.prices[level] || 0;
}

function conditionQuote(
  product: TradeProduct | undefined,
  fallback: TradeProduct["prices"] | undefined,
  screen = "excellent",
  body = "excellent",
) {
  const screenLevel = screenGrade[screen] ?? 1;
  const bodyLevel = bodyGrade[body] ?? 1;
  const worst = Math.max(screenLevel, bodyLevel) as 1 | 2 | 4;
  const amounts: number[] = [];
  if (screenLevel === worst) {
    const amount = product?.screenPrices[screenOrder.indexOf(screen)] ?? 0;
    if (amount > 0) amounts.push(amount);
  }
  if (bodyLevel === worst) {
    const amount = product?.bodyPrices[bodyOrder.indexOf(body)] ?? 0;
    if (amount > 0) amounts.push(amount);
  }
  if (amounts.length) return Math.min(...amounts);
  if (product) return product.prices[worst] || 0;
  return fallback?.[worst] ?? 0;
}

function brandCode(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return brands.find((brand) => brand.id === clean || brand.name === clean)?.id ?? clean;
}

function lineCode(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return lines.find((line) => line.id === clean || line.name === clean)?.id ?? clean;
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
    image: "",
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

export function readTradeProducts(line = ""): TradeProduct[] {
  const saved = readSavedProducts();
  if (!saved?.length) return fallbackTradeProducts(line);
  const mapped = saved
    .filter((record) => record.cells[visibleIndex] === "✓" && (record.cells[titleIndex] ?? "").trim())
    .map((record) => {
      const name = record.cells[titleIndex].trim();
      const sku = (record.extra.sku || "").toLowerCase();
      const known = models.find((model) => model.id === sku || model.name === name);
      const code = sku || known?.id || `custom:${record.id}`;
      const productLine = lineCode(record.extra.subCategory) || known?.lineId || "";
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
        image: record.extra.image || "",
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
  return mapped.filter((item) => item.line === line);
}

function readSavedProducts() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`trione-admin:${tradeProductStorageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRecord[];
    if (!Array.isArray(parsed)) return null;
    return reindex(parsed.map((record, index) => normalizeRecord(record, index)));
  } catch {
    return null;
  }
}
