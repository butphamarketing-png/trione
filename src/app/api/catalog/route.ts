import { NextResponse } from "next/server";
import { createServiceClient, ensureMediaBucket, MEDIA_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

const FILE = "catalog/store.json";

export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({});
  await ensureMediaBucket(supabase);
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).download(FILE);
  if (error || !data) return NextResponse.json({});
  try {
    return NextResponse.json(JSON.parse(await data.text()));
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 });
  await ensureMediaBucket(supabase);
  const body = await req.text();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(FILE, body, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
