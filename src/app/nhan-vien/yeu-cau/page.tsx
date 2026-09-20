"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StaffRequestTable } from "@/components/staff-request-table";
import { statusLabel, type RequestStatus } from "@/data/staff";
import { useLiveRequests } from "@/lib/use-live-requests";

export default function RequestListPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const all = useLiveRequests();
  const items = useMemo(
    () =>
      all.filter((r) => {
        const byQ = !q.trim() || `${r.id} ${r.name} ${r.username} ${r.oldDevice}`.toLowerCase().includes(q.toLowerCase());
        const byS = status === "all" || r.status === status;
        return byQ && byS;
      }),
    [q, status, all]
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold">Yêu cầu thu cũ</h1>
          <p className="text-sm text-zinc-500">Danh sách yêu cầu được phân công cho bạn</p>
        </div>
        <Link href="/thu-cu" className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white">
          ▣ Tạo yêu cầu mới
        </Link>
      </div>
      <div className="mt-5 rounded-2xl bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64 rounded-full border px-4 py-1.5 text-sm"
            placeholder="Tìm mã yêu cầu..."
          />
          <button
            type="button"
            onClick={() => setStatus("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "all" ? "bg-[#e11d2e] text-white" : "bg-zinc-100"}`}
          >
            Tất cả
          </button>
          {(Object.keys(statusLabel) as RequestStatus[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatus(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status === k ? "bg-[#e11d2e] text-white" : "bg-zinc-100"
              }`}
            >
              {statusLabel[k]}
            </button>
          ))}
          <span className="ml-auto text-xs text-zinc-400">Hiển thị {items.length} yêu cầu</span>
        </div>
        <StaffRequestTable items={items} />
      </div>
    </div>
  );
}
