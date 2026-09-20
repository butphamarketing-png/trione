"use client";

import Link from "next/link";
import { StaffRequestTable } from "@/components/staff-request-table";
import { useLiveKpis, useLiveRequests } from "@/lib/use-live-requests";

export default function StaffDashboard() {
  const live = useLiveRequests();
  const stats = useLiveKpis();
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold">Bảng điều khiển nhân viên</h1>
          <p className="text-sm text-zinc-500">Tổng quan yêu cầu thu cũ và công việc xử lý hôm nay</p>
        </div>
        <Link href="/thu-cu" className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white">
          ▣ Tạo yêu cầu mới
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [stats.total, "Tổng yêu cầu", stats.totalDelta, "text-emerald-600"],
          [stats.waiting, "Chờ thẩm định", stats.waitingHint, "text-amber-600"],
          [stats.assessing, "Đang thẩm định", stats.assessingHint, "text-sky-700"],
          [stats.doneMonth, "Hoàn tất trong tháng", stats.doneHint, "text-green-600"],
        ].map(([n, l, h, c]) => (
          <div key={String(l)} className="rounded-2xl bg-white px-5 py-4">
            <p className="text-sm text-zinc-500">{l}</p>
            <p className="mt-2 text-[32px] leading-none font-bold">{n}</p>
            <p className={`mt-2 text-xs ${c}`}>{h}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#fff8ee] p-5">
        <div>
          <p className="font-semibold">Thao tác nhanh</p>
          <p className="text-sm text-zinc-500">Tạo mới và tiếp nhận yêu cầu thu cũ của khách hàng</p>
        </div>
        <Link href="/thu-cu" className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white">
          ▣ Tạo yêu cầu thu cũ
        </Link>
      </div>
      <div className="mt-5 rounded-2xl bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Yêu cầu gần đây</p>
            <p className="text-xs text-zinc-500">Các yêu cầu thu cũ mới nhất được phân công cho bạn</p>
          </div>
          <Link href="/nhan-vien/yeu-cau" className="text-sm text-zinc-600">
            Xem tất cả →
          </Link>
        </div>
        <StaffRequestTable />
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span>Hiển thị {live.length} yêu cầu trên bảng này</span>
          <span className="flex gap-2">
            <button type="button" className="rounded-full border px-2 py-1">
              ‹
            </button>
            <button type="button" className="rounded-full border px-2 py-1">
              ›
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
