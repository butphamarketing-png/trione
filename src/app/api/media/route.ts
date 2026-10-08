import { mkdir, readFile, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { mediaLibrary } from "@/lib/demo-media";
import { createServiceClient, ensureMediaBucket, MEDIA_BUCKET, mediaPublicUrl, storagePath } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dir = path.join(process.cwd(), ".data", "media");

function safeId(id: string) {
  return /^[\w:.-]{1,80}$/.test(id) ? id : "";
}

function fileName(id: string) {
  return `${id.replace(/:/g, "__")}.img`;
}

function localUrl(id: string, stamp = Date.now()) {
  return `/api/media?id=${encodeURIComponent(id)}&t=${stamp}`;
}

async function saveLocal(id: string, buf: Buffer, type: string) {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName(id)), buf);
  await writeFile(path.join(dir, `${fileName(id)}.json`), JSON.stringify({ type, updatedAt: Date.now() }));
}

async function readLocal(id: string) {
  try {
    const buf = await readFile(path.join(dir, fileName(id)));
    const meta = JSON.parse(await readFile(path.join(dir, `${fileName(id)}.json`), "utf8")) as { type?: string; updatedAt?: number };
    return { buf, type: meta.type || "image/jpeg", updatedAt: Number(meta.updatedAt || 0) };
  } catch {
    return null;
  }
}

async function localMap() {
  const map: Record<string, string> = {};
  try {
    const names = await readdir(dir);
    for (const name of names) {
      if (!name.endsWith(".img")) continue;
      const id = name.slice(0, -4).replace(/__/g, ":");
      if (!mediaLibrary.some((item) => item.id === id)) continue;
      const meta = await readLocal(id);
      map[id] = localUrl(id, meta?.updatedAt || Date.now());
    }
  } catch {
    return map;
  }
  return map;
}

async function remoteMap() {
  const supabase = createServiceClient();
  if (!supabase) return {};
  try {
    await ensureMediaBucket(supabase);
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list("", { limit: 100 });
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const item of data) {
      if (item.name.endsWith("/")) continue;
      const id = item.name.replace(/\.jpg$/i, "").replace(/__/g, ":");
      if (!mediaLibrary.some((entry) => entry.id === id)) continue;
      map[id] = mediaPublicUrl(id, item.updated_at ?? item.created_at ?? Date.now().toString());
    }
    return map;
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const id = safeId(new URL(req.url).searchParams.get("id") ?? "");
  if (id) {
    const file = await readLocal(id);
    if (!file) return NextResponse.json({ error: "Không có ảnh" }, { status: 404 });
    return new NextResponse(new Uint8Array(file.buf), {
      headers: {
        "content-type": file.type,
        "cache-control": "no-cache",
      },
    });
  }
  const local = await localMap();
  const remote = await remoteMap();
  return NextResponse.json({ ...remote, ...local });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const id = safeId(String(form.get("id") ?? ""));
  const file = form.get("file");
  if (!id || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu id hoặc file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type || "image/jpeg";
  try {
    await saveLocal(id, buf, type);
  } catch {
    return NextResponse.json({ error: "Không lưu được ảnh" }, { status: 500 });
  }
  const supabase = createServiceClient();
  if (supabase) {
    try {
      await ensureMediaBucket(supabase);
      await supabase.storage.from(MEDIA_BUCKET).upload(storagePath(id), buf, {
        upsert: true,
        contentType: type,
        cacheControl: "3600",
      });
    } catch {
      /* ảnh trên máy vẫn hiện được ở trang chủ */
    }
  }
  return NextResponse.json({ id, url: localUrl(id) });
}

export async function DELETE(req: Request) {
  const id = safeId(new URL(req.url).searchParams.get("id") ?? "");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  await unlink(path.join(dir, fileName(id))).catch(() => undefined);
  await unlink(path.join(dir, `${fileName(id)}.json`)).catch(() => undefined);
  const supabase = createServiceClient();
  if (supabase) {
    try {
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath(id)]);
    } catch {
      /* đã xóa bản trên máy */
    }
  }
  return NextResponse.json({ ok: true });
}
