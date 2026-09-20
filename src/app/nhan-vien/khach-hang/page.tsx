"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveCustomers } from "@/lib/use-live-requests";

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const customers = useLiveCustomers();
  const items = useMemo(
    () =>
      customers.filter(
        (c) =>
          !q.trim() ||
          `${c.username} ${c.name} ${c.phone} ${c.address} ${c.type}`.toLowerCase().includes(q.toLowerCase())
      ),
    [q, customers]
  );

  return (
    <div>
      <h1 className="text-[26px] font-bold">Khách hàng</h1>
      <p className="text-sm text-zinc-500">Tài khoản khách và CTV đã gửi yêu cầu thu cũ</p>
      <div className="mt-5 rounded-2xl bg-white p-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-4 w-64 rounded-full border px-4 py-1.5 text-sm"
          placeholder="Tìm username..."
        />
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] tracking-wide text-zinc-400">
            <tr>
              <th className="py-2 font-medium">USERNAME</th>
              <th className="font-medium">HỌ TÊN</th>
              <th className="font-medium">SĐT</th>
              <th className="font-medium">ĐỊA CHỈ</th>
              <th className="font-medium">LOẠI</th>
              <th className="font-medium">SỐ YÊU CẦU</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.username} className="border-t border-zinc-100">
                <td className="py-3 font-medium">
                  {c.username}
                  {c.type === "CTV" ? (
                    <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-[#e11d2e]">CTV</span>
                  ) : null}
                </td>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.address}</td>
                <td>{c.type}</td>
                <td>
                  <Link href="/nhan-vien/yeu-cau" className="font-medium text-[#e11d2e]">
                    {c.orders}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
