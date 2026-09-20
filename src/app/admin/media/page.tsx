"use client";

import { useState } from "react";
import { hydrateMediaFromCloud, mediaLibrary, resetMedia, saveMedia } from "@/lib/demo-media";
import { useMediaOverrides, useMediaSrc } from "@/lib/use-live-media";

export default function MediaPage() {
  const overrides = useMediaOverrides();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function replace(id: string, file?: File) {
    if (!file) return;
    setBusy(id);
    setErr("");
    try {
      const body = new FormData();
      body.set("id", id);
      body.set("file", file);
      const res = await fetch("/api/media", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Không tải được ảnh lên Supabase");
      saveMedia(id, json.url);
      await hydrateMediaFromCloud();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải ảnh");
    } finally {
      setBusy(null);
    }
  }

  async function restore(id: string) {
    setBusy(id);
    setErr("");
    try {
      await fetch(`/api/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      resetMedia(id);
      await hydrateMediaFromCloud();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi khôi phục");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold">Quản lý hình ảnh · video</h1>
          <p className="mt-1 max-w-xl text-xs text-zinc-500">
            Ảnh lưu trên Supabase Storage. Đổi ở đây sẽ hiện trên trang khách (mọi máy), sau khi tải xong.
          </p>
          {err ? <p className="mt-2 text-xs text-[#e11d2e]">{err}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {mediaLibrary.map((it) => (
          <MediaCard
            key={it.id}
            id={it.id}
            label={it.label}
            fallback={it.fallback}
            usedOn={it.usedOn}
            custom={!!overrides[it.id]}
            busy={busy === it.id}
            onFile={(f) => replace(it.id, f)}
            onReset={() => restore(it.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MediaCard({
  id,
  label,
  fallback,
  usedOn,
  custom,
  busy,
  onFile,
  onReset,
}: {
  id: string;
  label: string;
  fallback: string;
  usedOn: string;
  custom: boolean;
  busy: boolean;
  onFile: (file: File) => void;
  onReset: () => void;
}) {
  const src = useMediaSrc(id, fallback);
  return (
    <div className="overflow-hidden rounded-lg border bg-zinc-50">
      <img src={src} alt="" className="h-28 w-full bg-white object-cover" />
      <div className="space-y-1 px-2 py-2">
        <p className="text-xs font-medium text-zinc-700">{label}</p>
        <p className="text-[10px] text-zinc-400">{usedOn}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          <label className={`relative cursor-pointer rounded bg-[#2f6fed] px-2 py-1 text-[11px] text-white ${busy ? "opacity-60" : ""}`}>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              disabled={busy}
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
                e.target.value = "";
              }}
            />
            {busy ? "Đang tải…" : "Đổi ảnh"}
          </label>
          {custom ? (
            <button type="button" disabled={busy} onClick={onReset} className="rounded border bg-white px-2 py-1 text-[11px]">
              Khôi phục
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
