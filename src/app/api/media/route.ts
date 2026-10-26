import { mkdir, readFile, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isMediaSlotId, isRequestPhotoId, isUploadableMediaId } from "@/lib/media-ids";
import { requestPhotoOwner } from "@/lib/request-photo-access";
import { readRequestSession } from "@/lib/api-session";
import { createServiceClient, ensureMediaBucket, ensurePrivateBucket, MEDIA_BUCKET, PRIVATE_BUCKET, mediaPublicUrl, storagePath } from "@/lib/supabase";

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

async function readRemoteFile(id: string) {
  const supabase = createServiceClient();
  if (!supabase) return null;
  try {
    const bucket = isRequestPhotoId(id) ? PRIVATE_BUCKET : MEDIA_BUCKET;
    const { data, error } = await supabase.storage.from(bucket).download(storagePath(id));
    if (error || !data) return null;
    return { buf: Buffer.from(await data.arrayBuffer()), type: data.type || "image/jpeg", updatedAt: Date.now() };
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
      if (!isMediaSlotId(id) || isRequestPhotoId(id)) continue;
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
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list("", { limit: 1000 });
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const item of data) {
      if (item.name.endsWith("/")) continue;
      const id = item.name.replace(/\.jpg$/i, "").replace(/__/g, ":");
      if (!isMediaSlotId(id)) continue;
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
    if (isRequestPhotoId(id)) {
      const session = readRequestSession(req);
      if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
      if (session.role === "customer") {
        const owner = await requestPhotoOwner(id);
        if (!owner || owner.toLowerCase() !== session.user.toLowerCase()) {
          return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
        }
      }
    }
    const file = (await readLocal(id)) ?? (await readRemoteFile(id));
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
  const session = readRequestSession(req);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const form = await req.formData();
  const id = safeId(String(form.get("id") ?? ""));
  const file = form.get("file");
  if (!id || !isUploadableMediaId(id) || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu id hợp lệ hoặc file" }, { status: 400 });
  }
  const requestPhoto = isRequestPhotoId(id);
  if (session.role !== "admin" && !requestPhoto) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (requestPhoto && session.role === "customer") {
    const owner = await requestPhotoOwner(id);
    if (owner === null || (owner && owner.toLowerCase() !== session.user.toLowerCase())) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type || "image/jpeg";
  let savedLocal = false;
  try {
    await saveLocal(id, buf, type);
    savedLocal = true;
  } catch {
    savedLocal = false;
  }
  let savedUrl = "";
  const supabase = createServiceClient();
  if (supabase) {
    try {
      if (requestPhoto) {
        await ensurePrivateBucket(supabase);
        const uploaded = await supabase.storage.from(PRIVATE_BUCKET).upload(storagePath(id), buf, {
          upsert: true,
          contentType: type,
          cacheControl: "no-cache",
        });
        if (!uploaded.error) savedUrl = localUrl(id);
      } else {
        await ensureMediaBucket(supabase);
        const uploaded = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath(id), buf, {
          upsert: true,
          contentType: type,
          cacheControl: "no-cache",
        });
        if (!uploaded.error) savedUrl = mediaPublicUrl(id, Date.now().toString());
      }
    } catch {
      savedUrl = "";
    }
  }
  if (supabase && !savedUrl) {
    return NextResponse.json({ error: "Không lưu được ảnh" }, { status: 502 });
  }
  if (!savedLocal && !savedUrl) {
    return NextResponse.json({ error: "Không lưu được ảnh" }, { status: 500 });
  }
  return NextResponse.json({ id, url: savedUrl || localUrl(id) });
}

export async function DELETE(req: Request) {
  const session = readRequestSession(req);
  if (session?.role !== "admin") return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const id = safeId(new URL(req.url).searchParams.get("id") ?? "");
  if (!id || !isUploadableMediaId(id)) return NextResponse.json({ error: "Thiếu id hợp lệ" }, { status: 400 });
  await unlink(path.join(dir, fileName(id))).catch(() => undefined);
  await unlink(path.join(dir, `${fileName(id)}.json`)).catch(() => undefined);
  const supabase = createServiceClient();
  if (supabase) {
    try {
      const bucket = isRequestPhotoId(id) ? PRIVATE_BUCKET : MEDIA_BUCKET;
      const removed = await supabase.storage.from(bucket).remove([storagePath(id)]);
      if (removed.error && !/not found|not_found/i.test(removed.error.message || "")) {
        return NextResponse.json({ error: "Không xóa được ảnh" }, { status: 502 });
      }
    } catch {
      return NextResponse.json({ error: "Không xóa được ảnh" }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}
