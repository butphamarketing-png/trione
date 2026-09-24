"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/store-footer";
import { useSiteSettings } from "@/lib/site-settings";
import { LogoutButton } from "@/components/logout-button";
import { staffStatusLabel } from "@/data/staff";
import { useLiveRequests } from "@/lib/use-live-requests";
import { readSession, type DemoSession } from "@/lib/session";

const nav = [
  { href: "/nhan-vien", label: "Bảng điều khiển", icon: GridIcon },
  { href: "/nhan-vien/yeu-cau", label: "Yêu cầu thu cũ", icon: ClipIcon },
  { href: "/nhan-vien/tai-khoan", label: "Tài khoản", icon: UserIcon },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const site = useSiteSettings();
  const [notes, setNotes] = useState(false);
  const [me, setMe] = useState<DemoSession>({
    user: "nv.anh",
    role: "staff",
    name: "Nguyễn Minh Anh",
    title: "Nhân viên thẩm định",
  });
  useEffect(() => {
    const s = readSession();
    if (s && s.role !== "admin") setMe(s);
    const pull = () => void import("@/lib/catalog-sync").then((mod) => mod.hydrateCatalog());
    pull();
    window.addEventListener("focus", pull);
    return () => window.removeEventListener("focus", pull);
  }, []);
  const waiting = useLiveRequests().filter((r) => r.status === "dang-cho-duyet");
  const initials = me.name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <header className="bg-[#1c1c1f] text-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div>
              <p className="text-sm font-bold tracking-wide" suppressHydrationWarning>{site.company}</p>
              <p className="text-[11px] text-zinc-400">Hệ thống quản lý chương trình thu cũ</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="relative">
              <button type="button" className="relative text-lg" aria-label="Thông báo" onClick={() => setNotes((v) => !v)}>
                🔔
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#e11d2e]" />
              </button>
              {notes && (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl bg-white p-3 text-zinc-800 shadow-xl">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">THÔNG BÁO</p>
                  {waiting.map((r) => (
                    <Link
                      key={r.id}
                      href={`/nhan-vien/yeu-cau/${r.id}`}
                      onClick={() => setNotes(false)}
                      className="mb-2 block rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">{r.id}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {r.oldDevice} · {staffStatusLabel[r.status]}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/nhan-vien/tai-khoan" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-600 text-xs">{initials}</span>
              <div>
                <p className="leading-tight font-medium">{me.name}</p>
                <p className="text-[11px] text-zinc-400">Tài khoản</p>
              </div>
            </Link>
            <LogoutButton className="text-xs text-zinc-400 hover:text-white" />
          </div>
        </div>
        <div className="h-[3px] bg-[#e11d2e]" />
      </header>
      <div className="flex">
        <aside className="flex min-h-[calc(100vh-58px)] w-[220px] flex-col border-r bg-white p-3">
          <p className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-[#e11d2e]">
            ● {me.role === "ctv" ? "CỔNG CTV" : "CỔNG NHÂN VIÊN"}
          </p>
          {nav.map((n) => {
            const active = n.href === "/nhan-vien" ? path === "/nhan-vien" : path.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  active ? "bg-rose-50 font-semibold text-[#e11d2e]" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Icon />
                {n.label}
              </Link>
            );
          })}
          <div className="mt-auto px-3 pb-4 text-xs text-zinc-400">
            <p className="font-medium text-zinc-500">? Trung tâm hỗ trợ</p>
            <p>Hướng dẫn sử dụng</p>
          </div>
        </aside>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" />
    </svg>
  );
}
function ClipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="4" y="2" width="9" height="12" rx="1.5" stroke="currentColor" />
      <path d="M6 1.5h4v2H6z" fill="currentColor" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" />
      <path d="M3 13c1.2-2 2.8-3 5-3s3.8 1 5 3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
