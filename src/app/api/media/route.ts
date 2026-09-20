import { NextResponse } from "next/server";
import { createServiceClient, ensureMediaBucket, MEDIA_BUCKET, mediaPublicUrl, storagePath } from "@/lib/supabase";
import { mediaLibrary } from "@/lib/demo-media";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({});
  await ensureMediaBucket(supabase);
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list("", { limit: 100 });
  if (error || !data) return NextResponse.json({});
  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.name.endsWith("/")) continue;
    const id = item.name.replace(/\.jpg$/i, "").replace(/__/g, ":");
    if (!mediaLibrary.some((m) => m.id === id) && !item.name) continue;
    map[id] = mediaPublicUrl(id, item.updated_at ?? item.created_at ?? Date.now().toString());
  }
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 });
  await ensureMediaBucket(supabase);
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const file = form.get("file");
  if (!id || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu id hoặc file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath(id), buf, {
    upsert: true,
    contentType: file.type || "image/jpeg",
    cacheControl: "3600",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id, url: mediaPublicUrl(id, Date.now().toString()) });
}

export async function DELETE(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  await supabase.storage.from(MEDIA_BUCKET).remove([storagePath(id)]);
  return NextResponse.json({ ok: true });
}
