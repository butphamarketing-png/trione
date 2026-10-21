import { brands, lines } from "@/data/catalog";
import { loadRecords, saveRecords, type AdminRecord } from "@/lib/admin-records";

export const level2StorageKey = "Danh mục cấp 2";

const titleIndex = 2;
const parentIndex = 3;
const visibleIndex = 4;

export type Level2Category = {
  key: string;
  code: string;
  name: string;
  slug: string;
  parent: string;
  blurb: string;
  image: string;
  thumb: string;
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

function toCategory(line: (typeof lines)[number], key = line.id): Level2Category {
  return {
    key,
    code: line.id,
    name: line.name,
    slug: slugify(line.name),
    parent: line.brandId,
    blurb: line.blurb,
    image: line.image,
    thumb: line.thumb,
    seoTitle: "",
    keywords: "",
    description: "",
  };
}

export function fallbackLevel2(parent = ""): Level2Category[] {
  const list = parent ? lines.filter((line) => line.brandId === parent) : lines;
  return list.map((line) => toCategory(line));
}

function parentCode(record: AdminRecord) {
  const saved = record.extra.category;
  if (saved) return saved;
  const name = (record.cells[parentIndex] ?? "").trim();
  return brands.find((brand) => brand.name === name)?.id ?? "";
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function brandName(brandId: string) {
  return brands.find((brand) => brand.id === brandId)?.name ?? "";
}

function alignLevel2(saved: AdminRecord[]) {
  const usedLineIds = new Set<string>();
  let changed = false;
  const records = saved.map((existing) => {
    const sku = (existing.extra.sku || "").trim();
    const title = (existing.cells[titleIndex] ?? "").trim();
    const category = (existing.extra.category || "").trim();
    const categoryName = (existing.cells[parentIndex] ?? "").trim();
    const line = lines.find((item) => {
      if (usedLineIds.has(item.id)) return false;
      const parent = brandName(item.brandId);
      return sku === item.id || (title === item.name && (category === item.brandId || categoryName === parent));
    });
    if (!line) return existing;
    usedLineIds.add(line.id);
    const parent = brandName(line.brandId);
    const skuChanged = existing.extra.sku !== line.id;
    const categoryChanged = existing.extra.category !== line.brandId;
    const parentChanged = (existing.cells[parentIndex] ?? "") !== parent;
    if (skuChanged || categoryChanged || parentChanged || !title) changed = true;
    return {
      ...existing,
      cells: existing.cells.map((cell, cellIndex) => {
        if (cellIndex === titleIndex) return title || line.name;
        if (cellIndex === parentIndex) return parent;
        return cell;
      }),
      extra: {
        ...existing.extra,
        sku: line.id,
        category: line.brandId,
        image: existing.extra.image || line.image,
        shortDesc: existing.extra.shortDesc || line.blurb,
      },
    };
  });
  return { records, changed };
}

export function matchedSavedLevel2(code: string) {
  if (!code || !loadRecords(level2StorageKey)?.length) return "";
  return readLevel2Categories().find((item) => item.code === code)?.code ?? "";
}

export function readLevel2Categories(parent = ""): Level2Category[] {
  const loaded = loadRecords(level2StorageKey);
  const aligned = loaded?.length ? alignLevel2(loaded) : null;
  if (aligned?.changed && typeof window !== "undefined") saveRecords(level2StorageKey, aligned.records);
  const saved = aligned?.records ?? loaded;
  if (!saved?.length) return fallbackLevel2(parent);
  const visible = saved.filter((record) => record.cells[visibleIndex] === "✓" && (record.cells[titleIndex] ?? "").trim());
  const mapped = visible.map((record) => {
    const name = record.cells[titleIndex].trim();
    const code = record.extra.sku || `custom:${record.id}`;
    const known = lines.find((line) => line.id === code);
    return {
      key: record.id,
      code,
      name,
      slug: record.extra.slug || slugify(name),
      parent: parentCode(record),
      blurb: record.extra.shortDesc || plainText(record.extra.description) || known?.blurb || "",
      image: record.extra.image || known?.image || "",
      thumb: known?.thumb ?? "",
      seoTitle: record.extra.seoTitle && record.extra.seoTitle !== name ? record.extra.seoTitle : "",
      keywords: record.extra.keywords || "",
      description: record.extra.description || "",
    };
  });
  if (!parent) return mapped;
  return mapped.filter((item) => item.parent === parent);
}

export function level2SheetRows() {
  const rows = [["mã", "tên", "danh mục cấp 1", "slug", "hiển thị"]];
  for (const item of readLevel2Categories()) {
    rows.push([item.code, item.name, item.parent, item.slug, "✓"]);
  }
  return rows;
}
