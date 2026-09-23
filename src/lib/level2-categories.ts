import { brands, lines } from "@/data/catalog";
import { normalizeRecord, reindex, type AdminRecord } from "@/lib/admin-records";

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
    image: "",
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

export function readLevel2Categories(parent = ""): Level2Category[] {
  const saved = readSavedLevel2();
  if (!saved?.length) return fallbackLevel2(parent);
  const visible = saved.filter((record) => record.cells[visibleIndex] === "✓" && (record.cells[titleIndex] ?? "").trim());
  const mapped = visible.map((record) => {
    const name = record.cells[titleIndex].trim();
    const code = record.extra.sku || `custom:${record.id}`;
    const known = lines.find((line) => line.id === code);
    const uploaded = record.extra.image && !record.extra.image.startsWith("/brands/");
    return {
      key: record.id,
      code,
      name,
      slug: record.extra.slug || slugify(name),
      parent: parentCode(record),
      blurb: record.extra.shortDesc || known?.blurb || "",
      image: uploaded ? record.extra.image : "",
      thumb: known?.thumb ?? "",
      seoTitle: record.extra.seoTitle || "",
      keywords: record.extra.keywords || "",
      description: record.extra.description || "",
    };
  });
  if (!parent) return mapped;
  return mapped.filter((item) => item.parent === parent);
}

function readSavedLevel2() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`trione-admin:${level2StorageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRecord[];
    if (!Array.isArray(parsed)) return null;
    return reindex(parsed.map((record, index) => normalizeRecord(record, index)));
  } catch {
    return null;
  }
}
