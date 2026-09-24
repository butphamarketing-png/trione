import { NextResponse } from "next/server";
import { createServiceClient, ensurePrivateBucket, MEDIA_BUCKET, PRIVATE_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE = "store.json";
const PUBLIC_FILE = "catalog/store.json";

const allowed = (key: string) =>
  key.startsWith("trione-admin:") ||
  key.startsWith("trione-staff-profile:") ||
  key === "trione-accounts" ||
  key === "trione-demo-requests" ||
  key === "trione-site-settings";

async function readJson(bucket: string, file: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return {};
  const res = await fetch(`${base}/storage/v1/object/${bucket}/${file}?t=${Date.now()}`, {
    headers: { authorization: `Bearer ${key}`, apikey: key },
    cache: "no-store",
  });
  if (!res.ok) return {};
  try {
    const parsed = (await res.json()) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function withoutTimes(stored: Record<string, string>) {
  const data = { ...stored };
  delete data.__times;
  return data;
}

export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({});
  await ensurePrivateBucket(supabase);
  const stored = withoutTimes(await readJson(PRIVATE_BUCKET, FILE));
  const legacy = withoutTimes(await readJson(MEDIA_BUCKET, PUBLIC_FILE));
  return NextResponse.json({ ...legacy, ...stored });
}

export async function PUT(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 });
  await ensurePrivateBucket(supabase);
  const incoming = (await req.json()) as Record<string, string>;
  const current = await readJson(PRIVATE_BUCKET, FILE);
  const times = JSON.parse(current.__times || "{}") as Record<string, number>;
  const incomingTimes = JSON.parse(incoming.__times || "{}") as Record<string, number>;
  const next: Record<string, string> = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "__times" || !allowed(key) || typeof value !== "string" || !value) continue;
    const nextTime = Number(incomingTimes[key] || Date.now());
    if (nextTime < Number(times[key] || 0)) continue;
    next[key] = value;
    times[key] = nextTime;
  }
  next.__times = JSON.stringify(times);
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(FILE, JSON.stringify(next), {
    upsert: true,
    contentType: "application/json",
    cacheControl: "no-cache",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
