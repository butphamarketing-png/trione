"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StaffRequestTable } from "@/components/staff-request-table";
import { readSession, type DemoSession } from "@/lib/session";
import { useLiveRequests } from "@/lib/use-live-requests";

const cards = [
  { key: "all", label: "Yêu cầu", href: "/nhan-vien/yeu-cau", hint: "Toàn bộ yêu cầu thu cũ" },
  { key: "dang-cho-duyet", label: "Đang chờ duyệt", href: "/nhan-vien/yeu-cau?trang-thai=dang-cho-duyet", hint: "Đơn mới, chưa được duyệt" },
  { key: "chua-duyet", label: "Chưa duyệt", href: "/nhan-vien/yeu-cau?trang-thai=chua-duyet", hint: "Đơn không được duyệt" },
  { key: "da-duyet", label: "Đã duyệt", href: "/nhan-vien/yeu-cau?trang-thai=da-duyet", hint: "Đơn đã duyệt" },
] as const;

export default function StaffDashboard() {
  const live = useLiveRequests();
  const [me, setMe] = useState<DemoSession | null>(null);
  useEffect(() => {
    setMe(readSession());
  }, []);
  const counts = {
    all: live.length,
    "dang-cho-duyet": live.filter((item) => item.status === "dang-cho-duyet").length,
    "chua-duyet": live.filter((item) => item.status === "chua-duyet").length,
    "da-duyet": live.filter((item) => item.status === "da-duyet").length,
  };
  const mine = live.filter((item) => {
    if (!me) return false;
    const source = item.source.toLowerCase();
    return item.username === me.user || source.includes(me.user) || (source.includes("nhân viên") && source.includes(me.name.toLowerCase()));
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold">Bảng điều khiển</h1>
          <p className="text-sm text-zinc-500">Tạo yêu cầu thu cũ và theo dõi công việc của bạn</p>
        </div>
        <Link href="/thu-cu" className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white">
          ▣ Tạo yêu cầu mới
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className="rounded-2xl bg-white px-5 py-4 hover:ring-1 hover:ring-[#e11d2e]">
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-2 text-[32px] leading-none font-bold">{counts[card.key]}</p>
            <p className="mt-2 text-xs text-zinc-400">{card.hint}</p>
          </Link>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Lịch sử tạo yêu cầu</p>
            <p className="text-xs text-zinc-500">Các yêu cầu thu cũ do tài khoản này tạo</p>
          </div>
          <Link href="/nhan-vien/yeu-cau" className="text-sm font-medium text-[#e11d2e]">
            Yêu cầu thu cũ →
          </Link>
        </div>
        {mine.length ? (
          <StaffRequestTable items={mine} />
        ) : (
          <p className="rounded-xl bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
            Chưa có yêu cầu do bạn tạo. Bấm Tạo yêu cầu mới để lập yêu cầu thu cũ.
          </p>
        )}
      </div>
    </div>
  );
}
