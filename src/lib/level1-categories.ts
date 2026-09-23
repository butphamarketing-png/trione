import { brands } from "@/data/catalog";
import { normalizeRecord, reindex, type AdminRecord } from "@/lib/admin-records";

export const level1StorageKey = "Danh mục cấp 1";

const titleIndex = 2;
const visibleIndex = 5;

export type Level1Category = {
  key: string;
  code: string;
  name: string;
  slug: string;
  line: string;
  image: string;
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

export function categorySlug(code: string, name: string, saved = "") {
  const custom = saved.trim();
  if (custom) return custom;
  if (code === "samsung") return "sam-sung";
  if (code && code !== "other" && !code.startsWith("custom:")) return code;
  return slugify(name) || code;
}

export function fallbackLevel1(): Level1Category[] {
  return [
    ...brands.map((brand) => ({
      key: brand.id,
      code: brand.id,
      name: brand.name,
      slug: categorySlug(brand.id, brand.name),
      line: brand.line,
      image: `/brands/${brand.id}.svg`,
      seoTitle: "",
      keywords: "",
      description: "",
    })),
    { key: "other", code: "other", name: "Thương hiệu khác", slug: "thuong-hieu-khac", line: "", image: "/brands/other.svg", seoTitle: "", keywords: "", description: "" },
  ];
}

function codeFor(record: AdminRecord, name: string) {
  const saved = record.extra.sku;
  if (saved && (saved === "other" || brands.some((brand) => brand.id === saved) || saved.startsWith("custom:"))) return saved;
  const known = brands.find((brand) => brand.name === name);
  if (known) return known.id;
  if (name === "Thương hiệu khác") return "other";
  return saved || `custom:${record.id}`;
}

export function readLevel1Categories(includeHidden = false): Level1Category[] {
  const saved = readSavedLevel1();
  if (!saved?.length) return fallbackLevel1();
  const visible = saved.filter((record) => (includeHidden || record.cells[visibleIndex] === "✓") && (record.cells[titleIndex] ?? "").trim());
  if (!visible.length) return [];
  return visible.map((record) => {
    const name = record.cells[titleIndex].trim();
    const code = codeFor(record, name);
    const brand = brands.find((item) => item.id === code);
    return {
      key: record.id,
      code,
      name,
      slug: categorySlug(code, name, record.extra.slug),
      line: brand?.line ?? "",
      image: record.extra.image || (brand ? `/brands/${brand.id}.svg` : code === "other" ? "/brands/other.svg" : ""),
      seoTitle: record.extra.seoTitle || "",
      keywords: record.extra.keywords || "",
      description: record.extra.description || "",
    };
  });
}

function readSavedLevel1() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`trione-admin:${level1StorageKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRecord[];
    if (!Array.isArray(parsed)) return null;
    return reindex(parsed.map((record, index) => normalizeRecord(record, index)));
  } catch {
    return null;
  }
}
