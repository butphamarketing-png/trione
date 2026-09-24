"use client";

import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";
import { WatchFace } from "@/components/watch-face";
import { staffStatusLabel, statusClass, type RequestStatus } from "@/data/staff";
import { patchRequest } from "@/lib/demo-requests";
import { useLiveRequests } from "@/lib/use-live-requests";
import { vnd } from "@/lib/pricing";

function gradeLabel(grade: string) {
  const level = grade.match(/[1-5]/)?.[0];
  return level ? `Loại ${level}` : grade || "—";
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const live = useLiveRequests();
  const found = live.find((r) => r.id === id);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<RequestStatus>("dang-cho-duyet");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (!found) return;
    setDraft(found.status);
    setNote(found.note);
  }, [id, found?.id, found?.status, found?.note]);

  if (!found) {
    if (!ready) {
      return <p className="text-sm text-zinc-400">Đang tải yêu cầu…</p>;
    }
    return <p className="text-sm text-zinc-500">Không tìm thấy yêu cầu {id}.</p>;
  }

  const due = found.newPrice - found.tradeIn;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold">Chi tiết yêu cầu thu cũ</h1>
          <p className="text-sm text-zinc-500">Thông tin đầy đủ của yêu cầu {found.id}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/nhan-vien/yeu-cau" className="rounded-lg border bg-white px-4 py-2 text-sm">
            ← Trở về
          </Link>
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value as RequestStatus)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
            aria-label="Chọn trạng thái"
          >
            {Object.entries(staffStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              patchRequest(found.id, { status: draft });
              setSaved(`Đã cập nhật yêu cầu ${found.id} · trạng thái ${staffStatusLabel[draft]}`);
            }}
            className="rounded-lg bg-[#e11d2e] px-4 py-2 text-sm font-semibold text-white"
          >
            Cập nhật trạng thái
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-8">
        <Meta icon="▣" k="MÃ ĐƠN HÀNG" v={found.id} />
        <Meta k="USERNAME" v={found.username} />
        <Meta k="NGÀY ĐẶT" v={found.createdAt} />
        <span className={`ml-auto rounded-full px-3 py-1 text-xs ${statusClass[found.status]}`}>
          ● {staffStatusLabel[found.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5">
          <p className="font-semibold">Thông tin đơn hàng</p>
          <p className="mb-3 text-[11px] text-zinc-400">THÔNG TIN TÀI KHOẢN VÀ GIAO DỊCH</p>
          <Row k="Mã đơn hàng" v={found.id} />
          <Row k="Username" v={found.username} />
          <Row k="Ngày đặt" v={found.createdAt} />
          <Row k="Địa chỉ" v={found.address} />
          <Row k="Nguồn" v={found.source} />
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="font-semibold">Thiết bị thu cũ</p>
          <p className="mb-3 text-[11px] text-zinc-400">THÔNG TIN THIẾT BỊ KHÁCH HÀNG GỬI</p>
          <Row k="Hãng" v={found.brand} />
          <Row k="Tên thu cũ" v={found.oldDevice} />
          <Row k="IMEI thu cũ" v={found.imeiOld || "Chưa nhập"} />
          <Row k="Tình trạng máy" v={gradeLabel(found.grade)} />
          <p className="mt-2 mb-1 text-xs text-zinc-500">Chi tiết tình trạng</p>
          <div className="flex flex-wrap gap-1">
            {found.tags.map((t) => (
              <span key={t} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-400">{found.photoCount} ảnh thiết bị đã tải lên</p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="font-semibold">Sản phẩm đổi mới</p>
          <p className="mb-3 text-[11px] text-zinc-400">SẢN PHẨM GARMIN ĐÃ CHỌN</p>
          <Row k="Tên đổi mới" v={found.newDevice} />
          <Row k="IMEI máy đổi mới" v={found.imeiNew || "Chưa nhập"} accent={!found.imeiNew} />
          <Row k="Giá sản phẩm mới" v={vnd(found.newPrice)} />
          <Row k="Khấu trừ máy cũ" v={`− ${vnd(found.tradeIn)}`} />
          <p className="mt-3 flex justify-between rounded-lg bg-rose-50 px-3 py-2 font-bold text-[#e11d2e]">
            <span>TỔNG GIÁ</span>
            <span>{vnd(due)}</span>
          </p>
        </div>
      </div>

      {saved && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{saved}</p>
      )}

      <div className="mt-4 rounded-2xl bg-white p-5">
        <p className="mb-2 text-sm font-semibold">Ghi chú</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
          rows={3}
        />
        <button
          type="button"
          onClick={() => {
            patchRequest(found.id, { note });
            setSaved(`Đã lưu ghi chú yêu cầu ${found.id}`);
          }}
          className="mt-2 rounded-lg bg-[#e11d2e] px-4 py-2 text-sm font-semibold text-white"
        >
          Lưu ghi chú
        </button>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-5">
        <div className="mb-3 flex justify-between">
          <p className="text-sm font-semibold">Hình ảnh thiết bị</p>
          <span className="text-xs text-[#e11d2e]">Xem toàn bộ {found.photoCount} ảnh →</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <PhotoSlot label="MẶT TRƯỚC" tone="ok">
            <WatchFace face="#222" strap="#c45a28" time="10:09" size={92} />
          </PhotoSlot>
          <PhotoSlot label="MẶT SAU" tone="ok">
            <WatchFace face="#c8c4bc" strap="#d9d3c7" time="" size={92} />
          </PhotoSlot>
          <PhotoSlot label="SỐ SERIAL" tone="ok">
            <div className="flex h-16 w-[70%] flex-col justify-center gap-1.5 rounded bg-white px-3 py-2">
              <span className="block h-1.5 w-full bg-zinc-800" />
              <span className="block h-1.5 w-[85%] bg-zinc-800" />
              <span className="block h-1.5 w-[70%] bg-zinc-800" />
              <span className="mt-1 h-2 w-8 self-end bg-zinc-900" />
            </div>
          </PhotoSlot>
          <PhotoSlot label="LỖI NGOẠI QUAN" tone="warn">
            <div className="relative">
              <WatchFace face="#1c1c1c" strap="#2a2a2a" time="" size={92} />
              <span className="absolute top-6 right-2 h-3 w-3 rounded-full bg-[#e11d2e]" />
            </div>
          </PhotoSlot>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon, k, v }: { icon?: string; k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-400">{k}</p>
      <p className="font-bold">
        {icon} {v}
      </p>
    </div>
  );
}
function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-zinc-500">{k}</span>
      <span className={`text-right font-medium ${accent ? "rounded bg-amber-50 px-2 py-0.5 text-amber-700" : ""}`}>{v}</span>
    </div>
  );
}

function PhotoSlot({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "ok" | "warn";
  children: ReactNode;
}) {
  return (
    <div
      className={`relative grid aspect-[5/4] place-items-center rounded-xl ${
        tone === "warn" ? "bg-rose-50" : "bg-[#f3f3f4]"
      }`}
    >
      {children}
      <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 text-[10px]">{label}</span>
    </div>
  );
}
