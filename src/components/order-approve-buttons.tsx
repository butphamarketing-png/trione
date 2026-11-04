"use client";

import { useState } from "react";
import { staffStatusLabel, type RequestStatus } from "@/data/staff";
import { patchRequest } from "@/lib/demo-requests";

function stampNow() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function OrderApproveButtons({
  id,
  status,
  compact = false,
  onDone,
}: {
  id: string;
  status: RequestStatus;
  compact?: boolean;
  onDone?: (ok: boolean, message: string, status: RequestStatus) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function setStatus(next: RequestStatus) {
    if (busy || !id) return;
    setBusy(true);
    const ok = await patchRequest(id, { status: next, updatedAt: stampNow() });
    onDone?.(ok, ok ? `Đã cập nhật ${id} · ${staffStatusLabel[next]}` : `Chưa lưu được ${id}. Thử lại.`, next);
    setBusy(false);
  }

  const btn = compact
    ? "rounded px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
    : "rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy || status === "da-duyet"}
        onClick={() => void setStatus("da-duyet")}
        className={`${btn} ${status === "da-duyet" ? "bg-emerald-700" : "bg-emerald-600"}`}
      >
        {status === "da-duyet" ? "Đã duyệt" : "Duyệt"}
      </button>
      <button
        type="button"
        disabled={busy || status === "chua-duyet"}
        onClick={() => void setStatus("chua-duyet")}
        className={`${btn} ${status === "chua-duyet" ? "bg-rose-800" : "bg-[#e11d2e]"}`}
      >
        {status === "chua-duyet" ? "Không duyệt" : "Không duyệt"}
      </button>
    </span>
  );
}
