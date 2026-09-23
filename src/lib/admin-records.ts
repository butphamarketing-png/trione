export type AdminExtra = {
  seoTitle: string;
  keywords: string;
  description: string;
  summary: string;
  order: string;
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
  return { seoTitle: "", keywords: "", description: "", summary: "", order };
}

export function seedRecords(rows: string[][]): AdminRecord[] {
  return rows.map((cells, i) => ({
    id: String(i + 1),
    cells: [...cells],
    extra: { ...blankExtra(cells[0] ?? String(i + 1)), seoTitle: cells[1] ?? "" },
  }));
}

export function cloneRecord(record: AdminRecord): AdminRecord {
  return { id: record.id, cells: [...record.cells], extra: { ...record.extra } };
}

export function reindex(list: AdminRecord[]): AdminRecord[] {
  const sorted = [...list].sort((a, b) => {
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
  return hit?.dirty ? hit.records : null;
}

export function loadRecords(key: string): AdminRecord[] | null {
  const hit = memory.get(key);
  if (hit?.dirty) return hit.records;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRecord[];
    if (!Array.isArray(parsed)) return null;
    memory.set(key, { dirty: true, records: parsed });
    return parsed;
  } catch {
    return null;
  }
}

export function saveRecords(key: string, records: AdminRecord[]) {
  const next = reindex(records);
  memory.set(key, { dirty: true, records: next });
  if (typeof window !== "undefined") {
    sessionStorage.setItem(storageKey(key), JSON.stringify(next));
  }
  return next;
}
