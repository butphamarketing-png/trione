import { NextResponse } from "next/server";
import { createServiceClient, ensurePrivateBucket, MEDIA_BUCKET, PRIVATE_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

const FILE = "store.json";
const PUBLIC_FILE = "catalog/store.json";

const allowed = (key: string) =>
  key.startsWith("trione-admin:") ||
  key.startsWith("trione-staff-profile:") ||
  key === "trione-accounts" ||
  key === "trione-demo-requests" ||
  key === "trione-site-settings";

async function readJson(supabase: NonNullable<ReturnType<typeof createServiceClient>>, bucket: string, file: string) {
  const { data, error } = await supabase.storage.from(bucket).download(file);
  if (error || !data) return {};
  try {
    const parsed = JSON.parse(await data.text()) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({});
  await ensurePrivateBucket(supabase);
  const stored = await readJson(supabase, PRIVATE_BUCKET, FILE);
  const legacy = await readJson(supabase, MEDIA_BUCKET, PUBLIC_FILE);
  return NextResponse.json({ ...legacy, ...stored });
}

export async function PUT(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 });
  await ensurePrivateBucket(supabase);
  const incoming = (await req.json()) as Record<string, string>;
  const current = await readJson(supabase, PRIVATE_BUCKET, FILE);
  const next: Record<string, string> = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (allowed(key) && typeof value === "string" && value) next[key] = value;
  }
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(FILE, JSON.stringify(next), {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
