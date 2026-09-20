"use client";

import Link from "next/link";
import { models, garminNew } from "@/data/catalog";
import { statusLabel } from "@/data/staff";
import { useLiveKpis, useLiveRequests } from "@/lib/use-live-requests";

export default function AdminHome() {
  const stats = useLiveKpis();
  const recent = useLiveRequests().slice(0, 8);
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Bảng điều khiển</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat n={stats.total} l="Yêu cầu thu cũ" href="/admin/don-hang" />
        <Stat n={stats.waiting} l="Chờ thẩm định" href="/admin/don-hang" />
        <Stat n={models.length} l="SP thu cũ" href="/admin/san-pham-thu-cu" />
        <Stat n={garminNew.length} l="SP đổi mới" href="/admin/doi-moi" />
      </div>
      <div className="mt-6 overflow-hidden rounded-sm border-t-4 border-[#2f6fed] bg-white">
        <h2 className="p-4 font-semibold">Đơn gần đây</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-2">Mã</th>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Máy cũ</th>
              <th className="px-4 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 font-medium">{r.id}</td>
                <td className="px-4 py-2">{r.username}</td>
                <td className="px-4 py-2">{r.oldDevice}</td>
                <td className="px-4 py-2">{statusLabel[r.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Stat({ n, l, href }: { n: number; l: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl bg-white p-4">
      <p className="text-sm text-zinc-500">{l}</p>
      <p className="text-2xl font-bold">{n}</p>
    </Link>
  );
}
