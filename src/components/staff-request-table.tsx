"use client";

import Link from "next/link";
import { staffStatusLabel, statusClass, type TradeRequest } from "@/data/staff";
import { useLiveRequests } from "@/lib/use-live-requests";
import { vnd } from "@/lib/pricing";

export function StaffRequestTable({ items }: { items?: TradeRequest[] }) {
  const live = useLiveRequests();
  const rows = items ?? live;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-[11px] tracking-wide text-zinc-400">
        <tr>
          <th className="py-2 font-medium">MÃ YÊU CẦU</th>
          <th className="font-medium">TÊN TÀI KHOẢN</th>
          <th className="font-medium">THIẾT BỊ THU CŨ</th>
          <th className="font-medium">GARMIN ĐỔI MỚI</th>
          <th className="font-medium">GIÁ THU DỰ KIẾN</th>
          <th className="font-medium">TRẠNG THÁI</th>
          <th className="font-medium">CẬP NHẬT</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-zinc-100">
            <td className="py-3">
              <Link href={`/nhan-vien/yeu-cau/${r.id}`} className="flex items-center gap-2 font-semibold">
                <span className="text-[#e11d2e]">▣</span>
                {r.id}
              </Link>
              <div className="pl-6 text-[11px] text-zinc-400">{r.createdAt.split("·")[0]}</div>
            </td>
            <td>
              {r.name}
              <div className="text-[11px] text-zinc-400">{r.username}</div>
            </td>
            <td>
              {r.oldDevice}
              <div className="text-[11px] text-zinc-400">{r.grade}</div>
            </td>
            <td>{r.newDevice}</td>
            <td className="font-medium">{vnd(r.tradeIn)}</td>
            <td>
              <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass[r.status]}`}>
                ● {staffStatusLabel[r.status]}
              </span>
            </td>
            <td className="text-zinc-400">{r.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
