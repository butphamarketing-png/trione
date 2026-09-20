import { customers, kpis, requests, type RequestStatus, type TradeRequest } from "@/data/staff";

const KEY = "trione-demo-requests";

type Store = {
  extra: TradeRequest[];
  overrides: Record<string, Partial<TradeRequest>>;
};

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedList: TradeRequest[] = requests;

function empty(): Store {
  return { extra: [], overrides: {} };
}

function load(): Store {
  if (typeof window === "undefined") return empty();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    return {
      extra: Array.isArray(parsed.extra) ? parsed.extra : [],
      overrides: parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
    };
  } catch {
    return empty();
  }
}

function computeAll(store: Store): TradeRequest[] {
  const seeded = requests.map((r) => ({ ...r, ...store.overrides[r.id] }));
  const extras = store.extra.map((r) => ({ ...r, ...store.overrides[r.id] }));
  return [...extras, ...seeded];
}

function emit() {
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

function save(store: Store) {
  sessionStorage.setItem(KEY, JSON.stringify(store));
  emit();
}

export function subscribeRequests(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getRequestSnapshot(): TradeRequest[] {
  const raw = typeof window === "undefined" ? null : sessionStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  cachedList = computeAll(load());
  return cachedList;
}

export function getServerRequestSnapshot(): TradeRequest[] {
  return requests;
}

export function allRequests(): TradeRequest[] {
  return getRequestSnapshot();
}

export function findRequest(id: string): TradeRequest | undefined {
  return allRequests().find((r) => r.id === id);
}

export function saveTradeRequest(request: TradeRequest) {
  const store = load();
  store.extra = [request, ...store.extra.filter((r) => r.id !== request.id)];
  save(store);
}

export function patchRequest(id: string, patch: Partial<TradeRequest>) {
  const store = load();
  store.overrides[id] = { ...store.overrides[id], ...patch };
  save(store);
}

export function makeRequestCode() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `TRI-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function countStatus(list: TradeRequest[], status: RequestStatus) {
  return list.filter((r) => r.status === status).length;
}

export function kpisFrom(live: TradeRequest[]) {
  const extra = Math.max(0, live.length - requests.length);
  const delta = (status: RequestStatus) => countStatus(live, status) - countStatus(requests, status);
  return {
    total: kpis.total + extra,
    totalDelta: kpis.totalDelta,
    waiting: Math.max(0, kpis.waiting + delta("cho-tham-dinh")),
    waitingHint: kpis.waitingHint,
    assessing: Math.max(0, kpis.assessing + delta("dang-xu-ly")),
    assessingHint: kpis.assessingHint,
    doneMonth: Math.max(0, kpis.doneMonth + delta("hoan-tat")),
    doneHint: kpis.doneHint,
  };
}

export function liveKpis() {
  return kpisFrom(allRequests());
}

export type CustomerRow = (typeof customers)[number];

export function customersFrom(live: TradeRequest[]): CustomerRow[] {
  const extra = live.filter((r) => !requests.some((s) => s.id === r.id));
  const extraCount = new Map<string, number>();
  const extraSample = new Map<string, TradeRequest>();
  for (const r of extra) {
    extraCount.set(r.username, (extraCount.get(r.username) ?? 0) + 1);
    if (!extraSample.has(r.username)) extraSample.set(r.username, r);
  }
  const list = customers.map((c) => ({
    ...c,
    orders: c.orders + (extraCount.get(c.username) ?? 0),
  }));
  for (const [username, n] of extraCount) {
    if (customers.some((c) => c.username === username)) continue;
    const r = extraSample.get(username);
    if (!r) continue;
    list.unshift({
      username,
      name: r.name,
      phone: "—",
      address: r.address.split(",")[0]?.trim() || r.address,
      orders: n,
      type: r.source.toLowerCase().includes("ctv") ? "CTV" : "Khách",
    });
  }
  return list;
}

export function formatCreatedAt(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type { RequestStatus, TradeRequest };
