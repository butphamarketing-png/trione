"use client";

import Link from "next/link";
import { useState } from "react";
import { OrderApproveButtons } from "@/components/order-approve-buttons";
import { type TradeRequest } from "@/data/staff";
import { vnd } from "@/lib/pricing";

export function ApprovalQueue({
  items,
  detailBase,
}: {
  items: TradeRequest[];
  detailBase: string;
}) {
  const [notice, setNotice] = useState("");
  const [ok, setOk] = useState(true);

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
                <OrderApproveButtons
                  id={item.id}
                  status={item.status}
                  compact
                  onDone={(saved, message) => {
                    setOk(saved);
                    setNotice(message);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
