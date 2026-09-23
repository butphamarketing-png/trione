export type AdminAlbumImage = {
  id: string;
  src: string;
  order: string;
  title: string;
};

export type AdminExtra = {
  seoTitle: string;
  keywords: string;
  description: string;
  summary: string;
  order: string;
  image: string;
  featured: boolean;
  slug: string;
  robots: "index" | "noindex";
  canonical: string;
  ogSite: string;
  ogType: string;
  ogUrl: string;
  shortDesc: string;
  body: string;
  sku: string;
  category: string;
  subCategory: string;
  salePrice: string;
  newPrice: string;
  gradePrices: string[][];
  screenPrices: string[];
  bodyPrices: string[];
  album: AdminAlbumImage[];
};

export type AdminRecord = {
  id: string;
  cells: string[];
  extra: AdminExtra;
};

const memory = new Map<string, { dirty: boolean; records: AdminRecord[] }>();

function storageKey(key: string) {
  return `trione-admin:${key}`;
}

export function blankExtra(order = ""): AdminExtra {
  return {
    seoTitle: "",
    keywords: "",
    description: "",
    summary: "",
    order,
    image: "",
    featured: false,
    slug: "",
    robots: "index",
    canonical: "",
    ogSite: "",
    ogType: "",
    ogUrl: "",
    shortDesc: "",
    body: "",
    sku: "",
    category: "",
    subCategory: "",
    salePrice: "",
    newPrice: "",
    gradePrices: emptyGradePrices(),
    screenPrices: emptyConditionPrices(),
    bodyPrices: emptyConditionPrices(),
    album: [],
  };
}

export function emptyGradePrices() {
  return Array.from({ length: 4 }, () => ["", "", "", ""]);
}

export function emptyConditionPrices() {
  return ["", "", ""];
}

export function normalizeConditionPrices(value: string[] | undefined) {
  const blank = emptyConditionPrices();
  if (!Array.isArray(value)) return blank;
  return blank.map((_, index) => String(value[index] ?? ""));
}

export function normalizeGradePrices(value: string[][] | undefined) {
  const blank = emptyGradePrices();
  if (!Array.isArray(value)) return blank;
  return blank.map((row, grade) => row.map((_, issue) => String(value[grade]?.[issue] ?? "")));
}

export function normalizeRecord(record: Partial<AdminRecord> | null | undefined, index = 0): AdminRecord {
  const extra = record?.extra;
  const cells = Array.isArray(record?.cells) ? record.cells.map((cell) => String(cell ?? "")) : [];
  return {
    id: record?.id ? String(record.id) : String(index + 1),
    cells,
    extra: {
      seoTitle: extra?.seoTitle ?? "",
      keywords: extra?.keywords ?? "",
      description: extra?.description ?? "",
      summary: extra?.summary ?? "",
      order: extra?.order ?? cells[0] ?? String(index + 1),
      image: extra?.image ?? "",
      featured: Boolean(extra?.featured),
      slug: extra?.slug ?? "",
      robots: extra?.robots === "noindex" ? "noindex" : "index",
      canonical: extra?.canonical ?? "",
      ogSite: extra?.ogSite ?? "",
      ogType: extra?.ogType ?? "",
      ogUrl: extra?.ogUrl ?? "",
      shortDesc: extra?.shortDesc ?? "",
      body: extra?.body ?? "",
      sku: extra?.sku ?? "",
      category: extra?.category ?? "",
      subCategory: extra?.subCategory ?? "",
      salePrice: extra?.salePrice ?? "",
      newPrice: extra?.newPrice ?? "",
      gradePrices: normalizeGradePrices(extra?.gradePrices),
      screenPrices: normalizeConditionPrices(extra?.screenPrices),
      bodyPrices: normalizeConditionPrices(extra?.bodyPrices),
      album: Array.isArray(extra?.album)
        ? extra.album.map((item, imageIndex) => ({
            id: item?.id ? String(item.id) : String(imageIndex + 1),
            src: item?.src ?? "",
            order: item?.order ?? String(imageIndex + 1),
            title: item?.title ?? "",
          }))
        : [],
    },
  };
}

export function seedRecords(rows: string[][]): AdminRecord[] {
  return rows.map((cells, i) =>
    normalizeRecord(
      {
        id: String(i + 1),
        cells: [...cells],
        extra: { ...blankExtra(cells[0] ?? String(i + 1)), seoTitle: cells[1] ?? "" },
      },
      i
    )
  );
}

export function cloneRecord(record: AdminRecord): AdminRecord {
  return {
    id: record.id,
    cells: [...record.cells],
    extra: {
      ...record.extra,
      gradePrices: normalizeGradePrices(record.extra.gradePrices).map((row) => [...row]),
      screenPrices: normalizeConditionPrices(record.extra.screenPrices),
      bodyPrices: normalizeConditionPrices(record.extra.bodyPrices),
      album: (record.extra.album ?? []).map((item) => ({ ...item })),
    },
  };
}

export function reindex(list: AdminRecord[]): AdminRecord[] {
  const sorted = list.map((record, index) => normalizeRecord(record, index)).sort((a, b) => {
    const ao = Number(a.extra.order);
    const bo = Number(b.extra.order);
    const aOk = Number.isFinite(ao);
    const bOk = Number.isFinite(bo);
    if (aOk && bOk && ao !== bo) return ao - bo;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });
  return sorted.map((record, index) => ({
    ...record,
    cells: record.cells.map((cell, cellIndex) => (cellIndex === 0 ? String(index + 1) : cell)),
  }));
}

export function peekRecords(key: string): AdminRecord[] | null {
  const hit = memory.get(key);
  return hit?.dirty ? hit.records.map((record, index) => normalizeRecord(record, index)) : null;
}

export function loadRecords(key: string): AdminRecord[] | null {
  const hit = memory.get(key);
  if (hit?.dirty) return hit.records.map((record, index) => normalizeRecord(record, index));
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRecord[];
    if (!Array.isArray(parsed)) return null;
    const records = reindex(parsed.map((record, index) => normalizeRecord(record, index)));
    memory.set(key, { dirty: true, records });
    return records;
  } catch {
    return null;
  }
}

export function saveRecords(key: string, records: AdminRecord[]) {
  const next = reindex(records.map((record, index) => normalizeRecord(record, index)));
  memory.set(key, { dirty: true, records: next });
  if (typeof window !== "undefined") {
    sessionStorage.setItem(storageKey(key), JSON.stringify(next));
  }
  return next;
}
