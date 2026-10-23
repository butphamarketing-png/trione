import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { readRequestSession, type ApiSession } from "@/lib/api-session";
import { requests as seededRequests } from "@/data/staff";
import { createServiceClient, ensurePrivateBucket, MEDIA_BUCKET, PRIVATE_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE = "store.json";
const PUBLIC_FILE = "catalog/store.json";
const localFile = path.join(process.cwd(), ".data", "catalog.json");

const allowed = (key: string) =>
  key.startsWith("trione-admin:") ||
  key.startsWith("trione-staff-profile:") ||
  key === "trione-accounts" ||
  key === "trione-demo-requests" ||
  key === "trione-site-settings";

const customerKeys = new Set([
  "trione-site-settings",
  "trione-admin:Danh mục cấp 1",
  "trione-admin:Danh mục cấp 2",
  "trione-admin:Danh sách Sản phẩm thu cũ",
  "trione-admin:Sản phẩm đổi mới",
  "trione-admin:Quản lý Option",
  "trione-admin:Quản lý tình trạng máy",
]);

function asStore(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && item) out[key] = item;
  }
  return out;
}

function timesOf(store: Record<string, string>) {
  try {
    const parsed = JSON.parse(store.__times || "{}") as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function dirtyKeys(store: Record<string, string>) {
  try {
    const parsed = JSON.parse(store.__dirty || "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

type StoredAccount = {
  id?: string;
  name?: string;
  user?: string;
  role?: string;
  status?: string;
  password?: string;
};

function parseAccounts(raw: string | undefined) {
  try {
    const parsed = JSON.parse(raw || "[]") as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function canWrite(session: ApiSession, key: string) {
  if (!allowed(key)) return false;
  if (session.role === "admin") return true;
  if (key === "trione-demo-requests") return true;
  if (key.startsWith("trione-staff-profile:")) {
    const owner = key.slice("trione-staff-profile:".length);
    return session.role !== "customer" && owner.toLowerCase() === session.user.toLowerCase();
  }
  if (key === "trione-accounts") return session.role !== "customer";
  return false;
}

function looksLikeUnhydratedSeed(incoming: StoredAccount[], current: StoredAccount[]) {
  const incomingUsers = new Set(incoming.map((item) => (item.user || "").trim().toLowerCase()).filter(Boolean));
  if (!incomingUsers.has("admin") || incomingUsers.has("admin@lendoi.com")) return false;
  return current.some((item) => !incomingUsers.has((item.user || "").trim().toLowerCase()));
}

function mergeAccountRecords(currentRaw: string | undefined, incomingRaw: string, session: ApiSession) {
  const current = parseAccounts(currentRaw);
  const incoming = parseAccounts(incomingRaw);
  if (session.role === "admin" && looksLikeUnhydratedSeed(incoming, current)) return JSON.stringify(current);
  if (session.role !== "admin") {
    const mine = incoming.find((item) => (item.user || "").trim().toLowerCase() === session.user.toLowerCase());
    const name = mine?.name?.trim();
    if (!name) return JSON.stringify(current);
    return JSON.stringify(current.map((item) => ((item.user || "").trim().toLowerCase() === session.user.toLowerCase() ? { ...item, name } : item)));
  }
  const prevById = new Map(current.filter((item) => item.id).map((item) => [item.id as string, item]));
  const prevByUser = new Map(current.map((item) => [(item.user || "").trim().toLowerCase(), item]));
  const used = new Set<string>();
  const next: StoredAccount[] = [];
  for (const item of incoming) {
    const user = (item.user || "").trim();
    const userKey = user.toLowerCase();
    if (!user || used.has(userKey)) continue;
    used.add(userKey);
    const prev = (item.id && prevById.get(item.id)) || prevByUser.get(userKey);
    const password = (item.password || "").trim();
    next.push({
      id: item.id || prev?.id || `${Date.now()}`,
      name: (item.name || prev?.name || "").trim(),
      user,
      role: item.role || prev?.role || "Nhân viên",
      status: item.status === "Ngưng" ? "Ngưng" : "Hoạt động",
      password: password || prev?.password || "123456",
    });
  }
  return JSON.stringify(next);
}

function restrictIncoming(incoming: Record<string, string>, session: ApiSession, base: Record<string, string>) {
  const next: Record<string, string> = {};
  if (incoming.__times) next.__times = incoming.__times;
  if (incoming.__dirty) next.__dirty = incoming.__dirty;
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "__times" || key === "__dirty" || !canWrite(session, key)) continue;
    next[key] = value;
  }
  if (next["trione-accounts"]) {
    const currentAccounts = parseAccounts(base["trione-accounts"]);
    const incomingAccounts = parseAccounts(next["trione-accounts"]);
    if (!currentAccounts.length && incomingAccounts.every((item) => !(item.password || "").trim())) {
      delete next["trione-accounts"];
    } else {
      next["trione-accounts"] = mergeAccountRecords(base["trione-accounts"], next["trione-accounts"], session);
    }
  }
  if (next["trione-demo-requests"]) {
    next["trione-demo-requests"] = mergeRequests(base["trione-demo-requests"], next["trione-demo-requests"], session);
  }
  return next;
}

type RequestRow = { id?: string; username?: string };

function parseRequestStore(raw: string | undefined) {
  try {
    const parsed = JSON.parse(raw || "{}") as { extra?: RequestRow[]; overrides?: Record<string, Record<string, unknown>>; removed?: string[] };
    return {
      extra: Array.isArray(parsed.extra) ? parsed.extra : [],
      overrides: parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
      removed: Array.isArray(parsed.removed) ? parsed.removed.map(String) : [],
    };
  } catch {
    return { extra: [] as RequestRow[], overrides: {} as Record<string, Record<string, unknown>>, removed: [] as string[] };
  }
}

function requestOwner(id: string, extra: RequestRow[]) {
  const found = extra.find((item) => item.id === id);
  if (found?.username) return found.username;
  return seededRequests.find((item) => item.id === id)?.username || "";
}

function mergeRequests(currentRaw: string | undefined, incomingRaw: string, session: ApiSession) {
  const current = parseRequestStore(currentRaw);
  const incoming = parseRequestStore(incomingRaw);
  const extra = [...current.extra];
  const known = new Set(extra.map((item) => item.id));
  for (const item of incoming.extra) {
    if (!item?.id || known.has(item.id)) continue;
    const username = (item.username || "").trim();
    if (session.role === "customer" && username.toLowerCase() !== session.user.toLowerCase()) continue;
    extra.unshift(item);
    known.add(item.id);
  }
  const overrides = { ...current.overrides };
  for (const [id, patch] of Object.entries(incoming.overrides)) {
    if (!patch || typeof patch !== "object") continue;
    const owner = requestOwner(id, extra).toLowerCase();
    if (session.role === "customer" && owner !== session.user.toLowerCase()) continue;
    overrides[id] = { ...overrides[id], ...patch };
  }
  const removed =
    session.role === "admin" ? [...new Set([...(current.removed || []), ...(incoming.removed || [])])] : current.removed;
  return JSON.stringify({ extra, overrides, removed });
}

function withoutPasswords(store: Record<string, string>) {
  const raw = store["trione-accounts"];
  if (!raw) return store;
  const hidden = parseAccounts(raw).map((item) => ({ ...item, password: "" }));
  return { ...store, "trione-accounts": JSON.stringify(hidden) };
}

function forClient(store: Record<string, string>, session: ApiSession | null) {
  const times = timesOf(store);
  if (!session) {
    const next: Record<string, string> = {};
    if (store["trione-site-settings"]) next["trione-site-settings"] = store["trione-site-settings"];
    next.__times = JSON.stringify({ "trione-site-settings": Number(times["trione-site-settings"] || 0) });
    return next;
  }
  if (session.role !== "customer") return withoutPasswords(store);
  const next: Record<string, string> = {};
  const visibleTimes: Record<string, number> = {};
  for (const key of customerKeys) {
    if (!store[key]) continue;
    next[key] = store[key];
    visibleTimes[key] = Number(times[key] || 0);
  }
  next.__times = JSON.stringify(visibleTimes);
  return next;
}

function mergeStores(base: Record<string, string>, incoming: Record<string, string>, dirty = dirtyKeys(incoming)) {
  const next = { ...base };
  const times = timesOf(base);
  const incomingTimes = timesOf(incoming);
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "__times" || key === "__dirty" || !allowed(key) || !value) continue;
    if (dirty.has(key)) {
      next[key] = value;
      times[key] = Date.now();
      continue;
    }
    const stamped = Number(incomingTimes[key] || 0);
    const current = Number(times[key] || 0);
    if (!stamped) {
      if (next[key]) continue;
      next[key] = value;
      times[key] = Date.now();
      continue;
    }
    if (stamped < current) continue;
    next[key] = value;
    times[key] = stamped;
  }
  next.__times = JSON.stringify(times);
  return next;
}

async function readLocal() {
  try {
    return asStore(JSON.parse(await readFile(localFile, "utf8")));
  } catch {
    return {};
  }
}

async function writeLocal(data: Record<string, string>) {
  await mkdir(path.dirname(localFile), { recursive: true });
  await writeFile(localFile, JSON.stringify(data));
}

async function readJson(bucket: string, file: string): Promise<Record<string, string> | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${file}?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${key}`, apikey: key },
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return {};
      const text = await res.text();
      if (text.includes("not_found") || text.includes("Object not found")) return {};
      return null;
    }
    return asStore(await res.json());
  } catch {
    return null;
  }
}

async function readRemote() {
  const supabase = createServiceClient();
  if (!supabase) return {};
  try {
    await ensurePrivateBucket(supabase);
    const stored = await readJson(PRIVATE_BUCKET, FILE);
    const legacy = await readJson(MEDIA_BUCKET, PUBLIC_FILE);
    if (stored === null && legacy === null) return {};
    return mergeStores(legacy ?? {}, stored ?? {});
  } catch {
    return {};
  }
}

function storeChanged(before: Record<string, string>, after: Record<string, string>) {
  if (before.__times !== after.__times) return true;
  const beforeKeys = Object.keys(before).filter((key) => key !== "__times");
  const afterKeys = Object.keys(after).filter((key) => key !== "__times");
  if (beforeKeys.length !== afterKeys.length) return true;
  for (const key of afterKeys) {
    if (before[key] !== after[key]) return true;
  }
  return false;
}

export async function GET(req: Request) {
  const remote = await readRemote();
  const local = await readLocal();
  const merged = mergeStores(local, remote);
  if (Object.keys(remote).some((key) => key !== "__times") && storeChanged(local, merged)) {
    await writeLocal(merged).catch(() => undefined);
  }
  return NextResponse.json(forClient(merged, readRequestSession(req)));
}

export async function PUT(req: Request) {
  const session = readRequestSession(req);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const incomingRaw = asStore(await req.json());
  const localBefore = await readLocal();
  const remoteBefore = await readJson(PRIVATE_BUCKET, FILE);
  const passwordBase = remoteBefore?.["trione-accounts"] ? remoteBefore : localBefore;
  const incoming = restrictIncoming(incomingRaw, session, passwordBase);
  const local = mergeStores(localBefore, incoming);
  let savedLocal = false;
  try {
    await writeLocal(local);
    savedLocal = true;
  } catch {
    savedLocal = false;
  }

  let savedRemote = false;
  let storedTimes = local.__times || "";
  const supabase = createServiceClient();
  if (supabase) {
    try {
      await ensurePrivateBucket(supabase);
      if (remoteBefore === null) throw new Error("catalog unreadable");
      const next = mergeStores(remoteBefore, incoming);
      storedTimes = next.__times || storedTimes;
      const uploaded = await supabase.storage.from(PRIVATE_BUCKET).upload(FILE, JSON.stringify(next), {
        upsert: true,
        contentType: "application/json",
        cacheControl: "no-cache",
      });
      savedRemote = !uploaded.error;
    } catch {
      savedRemote = false;
    }
  }

  if (!savedLocal && !savedRemote) {
    return NextResponse.json({ error: "Không lưu được danh mục" }, { status: 500 });
  }
  if (supabase && !savedRemote) {
    return NextResponse.json({ error: "Không lưu được danh mục", savedLocal, savedRemote }, { status: 502 });
  }
  return NextResponse.json({ ok: true, savedLocal, savedRemote, times: storedTimes });
}
