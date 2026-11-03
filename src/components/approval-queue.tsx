"use client";

import Link from "next/link";
import { useState } from "react";
import { staffStatusLabel, type RequestStatus, type TradeRequest } from "@/data/staff";
import { patchRequest } from "@/lib/demo-requests";
import { vnd } from "@/lib/pricing";

function stampNow() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function ApprovalQueue({
  items,
  detailBase,
}: {
  items: TradeRequest[];
  detailBase: string;
}) {
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [ok, setOk] = useState(true);

  async function setStatus(id: string, status: RequestStatus) {
    if (busyId) return;
    setBusyId(id);
    const saved = await patchRequest(id, { status, updatedAt: stampNow() });
    setOk(saved);
    setNotice(saved ? `Đã cập nhật ${id} · ${staffStatusLabel[status]}` : `Chưa lưu được ${id}. Thử lại.`);
    setBusyId("");
  }

  if (!items.length) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-sm border-t-4 border-amber-400 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4">
        <div>
          <h2 className="font-semibold">Đơn chờ duyệt</h2>
          <p className="text-xs text-zinc-500">Sau khi khách gửi yêu cầu, duyệt tại đây. Trạng thái ghi lên máy chủ dùng chung.</p>
        </div>
        {notice ? <p className={`text-sm ${ok ? "text-emerald-700" : "text-[#e11d2e]"}`}>{notice}</p> : null}
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-zinc-500">
          <tr>
            <th className="px-3 py-2">Mã</th>
            <th className="hidden px-3 py-2 sm:table-cell">Khách</th>
            <th className="px-3 py-2">Máy cũ</th>
            <th className="hidden px-3 py-2 lg:table-cell">Giá thu</th>
            <th className="px-3 py-2">Duyệt</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-medium whitespace-nowrap">
                <Link href={`${detailBase}/${item.id}`} className="text-[#2f6fed] hover:underline">
                  {item.id}
                </Link>
              </td>
              <td className="hidden px-3 py-2 sm:table-cell">{item.name}</td>
              <td className="px-3 py-2">{item.oldDevice}</td>
              <td className="hidden px-3 py-2 lg:table-cell">{vnd(item.tradeIn)}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => void setStatus(item.id, "da-duyet")}
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:bg-zinc-300"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => void setStatus(item.id, "chua-duyet")}
                    className="rounded bg-[#e11d2e] px-3 py-1 text-xs font-semibold text-white disabled:bg-zinc-300"
                  >
                    Không duyệt
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
