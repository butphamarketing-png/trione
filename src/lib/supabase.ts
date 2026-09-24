import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MEDIA_BUCKET = "trione-media";
export const PRIVATE_BUCKET = "trione-private";

export function storagePath(id: string) {
  return `${id.replace(/:/g, "__")}.jpg`;
}

export function mediaPublicUrl(id: string, updatedAt?: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  const url = `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath(id)}`;
  return updatedAt ? `${url}?t=${encodeURIComponent(updatedAt)}` : url;
}

export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function ensureMediaBucket(supabase: SupabaseClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.id === MEDIA_BUCKET || b.name === MEDIA_BUCKET)) return;
  await supabase.storage.createBucket(MEDIA_BUCKET, { public: true, fileSizeLimit: 8 * 1024 * 1024 });
}

export async function ensurePrivateBucket(supabase: SupabaseClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.id === PRIVATE_BUCKET || b.name === PRIVATE_BUCKET)) return;
  await supabase.storage.createBucket(PRIVATE_BUCKET, { public: false, fileSizeLimit: 8 * 1024 * 1024 });
}
