import { brands, lines } from "@/data/catalog";
import { blankExtra, loadRecords, normalizeRecord, saveRecords, type AdminRecord } from "@/lib/admin-records";

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
  const used = new Set<string>();
  let changed = false;
  const aligned = lines.map((line, index) => {
    const parent = brandName(line.brandId);
    const existing = saved.find((record) => {
      if (used.has(record.id)) return false;
      const sku = (record.extra.sku || "").trim();
      const title = (record.cells[titleIndex] ?? "").trim();
      const category = (record.extra.category || "").trim();
      const categoryName = (record.cells[parentIndex] ?? "").trim();
      return sku === line.id || (title === line.name && (category === line.brandId || categoryName === parent));
    });
    if (!existing) {
      changed = true;
      return normalizeRecord(
        {
          id: line.id,
          cells: [String(index + 1), "", line.name, parent, "✓"],
          extra: {
            ...blankExtra(String(index + 1)),
            sku: line.id,
            category: line.brandId,
            image: line.image,
            shortDesc: line.blurb,
            seoTitle: line.name,
          },
        },
        index
      );
    }
    used.add(existing.id);
    const skuChanged = existing.extra.sku !== line.id;
    const categoryChanged = existing.extra.category !== line.brandId;
    const titleChanged = (existing.cells[titleIndex] ?? "") !== line.name;
    if (skuChanged || categoryChanged || titleChanged) changed = true;
    return {
      ...existing,
      cells: existing.cells.map((cell, cellIndex) => {
        if (cellIndex === titleIndex) return line.name;
        if (cellIndex === parentIndex) return parent;
        if (cellIndex === visibleIndex) return cell || "✓";
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
  for (const record of saved) {
    if (!used.has(record.id)) aligned.push(record);
  }
  return { records: aligned, changed };
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
