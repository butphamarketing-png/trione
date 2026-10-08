import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
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

function mergeStores(base: Record<string, string>, incoming: Record<string, string>) {
  const next = { ...base };
  const times = timesOf(base);
  const incomingTimes = timesOf(incoming);
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "__times" || !allowed(key) || !value) continue;
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

async function readJson(bucket: string, file: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return {};
  try {
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${file}?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${key}`, apikey: key },
      cache: "no-store",
    });
    if (!res.ok) return {};
    return asStore(await res.json());
  } catch {
    return {};
  }
}

async function readRemote() {
  const supabase = createServiceClient();
  if (!supabase) return {};
  try {
    await ensurePrivateBucket(supabase);
    const stored = await readJson(PRIVATE_BUCKET, FILE);
    const legacy = await readJson(MEDIA_BUCKET, PUBLIC_FILE);
    return mergeStores(legacy, stored);
  } catch {
    return {};
  }
}

export async function GET() {
  const remote = await readRemote();
  const local = await readLocal();
  const merged = mergeStores(local, remote);
  if (Object.keys(remote).some((key) => key !== "__times")) {
    await writeLocal(merged).catch(() => undefined);
  }
  return NextResponse.json(merged);
}

export async function PUT(req: Request) {
  const incoming = asStore(await req.json());
  const local = mergeStores(await readLocal(), incoming);
  try {
    await writeLocal(local);
  } catch {
    return NextResponse.json({ error: "Không lưu được danh mục" }, { status: 500 });
  }

  const supabase = createServiceClient();
  if (supabase) {
    try {
      await ensurePrivateBucket(supabase);
      const current = await readJson(PRIVATE_BUCKET, FILE);
      const next = mergeStores(current, incoming);
      await supabase.storage.from(PRIVATE_BUCKET).upload(FILE, JSON.stringify(next), {
        upsert: true,
        contentType: "application/json",
        cacheControl: "no-cache",
      });
    } catch {
      /* bản trên máy vẫn là nguồn để trang chủ đọc */
    }
  }
  return NextResponse.json({ ok: true });
}
