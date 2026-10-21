"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCatalogMediaLibrary,
  hydrateMediaFromCloud,
  resetMedia,
  saveMedia,
  type MediaItem,
} from "@/lib/demo-media";
import { useMediaOverrides, useMediaSrc } from "@/lib/use-live-media";

type GroupFilter = "all" | MediaItem["group"];

const groups: { id: GroupFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "site", label: "Đăng nhập" },
  { id: "line", label: "Dòng SP" },
  { id: "trade", label: "Thu cũ" },
  { id: "exchange", label: "Đổi mới" },
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export default function MediaPage() {
  const overrides = useMediaOverrides();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<MediaItem[]>(mediaLibrarySeed);
  const [group, setGroup] = useState<GroupFilter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    function reload() {
      if (!alive) return;
      setItems(buildCatalogMediaLibrary());
    }
    reload();
    void import("@/lib/catalog-sync").then(async (mod) => {
      await mod.ensureCatalog();
      reload();
    });
    void hydrateMediaFromCloud();
    window.addEventListener("trione-catalog", reload);
    window.addEventListener("focus", reload);
    return () => {
      alive = false;
      window.removeEventListener("trione-catalog", reload);
      window.removeEventListener("focus", reload);
    };
  }, []);

  const visible = useMemo(() => {
    const tokens = fold(q).trim().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (group !== "all" && item.group !== group) return false;
      if (!tokens.length) return true;
      const hay = fold(`${item.label} ${item.usedOn} ${item.id}`);
      return tokens.every((token) => hay.includes(token));
    });
  }, [items, group, q]);

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
      if (!res.ok || !json.url) throw new Error(json.error || "Không lưu được ảnh");
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
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
            Danh sách lấy từ catalog đang dùng trên trang thu cũ (dòng, mẫu thu cũ, sản phẩm đổi mới) + banner đăng nhập. Đổi ảnh
            ở đây ghi đè ảnh mặc định của sản phẩm trên wizard.
          </p>
          {err ? <p className="mt-2 text-xs text-[#e11d2e]">{err}</p> : null}
        </div>
        <p className="text-xs text-zinc-400">{visible.length}/{items.length} ảnh</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {groups.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setGroup(item.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              group === item.id ? "bg-black text-white" : "border bg-white text-zinc-700"
            }`}
          >
            {item.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tìm tên sản phẩm, dòng, mã…"
          className="ml-auto w-full max-w-xs rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-[#2f6fed] sm:w-64"
        />
      </div>

      {visible.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {visible.map((it) => (
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
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
          Không có ảnh khớp bộ lọc. Thêm sản phẩm trong admin hoặc bỏ tìm kiếm.
        </p>
      )}
    </div>
  );
}

const mediaLibrarySeed: MediaItem[] = [
  { id: "login-bg", label: "Banner đăng nhập", fallback: "", usedOn: "Trang đăng nhập", group: "site" },
];

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
      {src ? (
        <img src={src} alt="" className="h-28 w-full bg-white object-cover" />
      ) : (
        <div className="grid h-28 w-full place-items-center bg-[radial-gradient(circle_at_top,#3a3a3a,#111)] text-[10px] text-zinc-400">
          Chưa có ảnh
        </div>
      )}
      <div className="space-y-1 px-2 py-2">
        <p className="line-clamp-2 text-xs font-medium text-zinc-700">{label}</p>
        <p className="truncate text-[10px] text-zinc-400" title={usedOn}>
          {usedOn}
        </p>
        <p className="truncate font-mono text-[10px] text-zinc-300">{id}</p>
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
