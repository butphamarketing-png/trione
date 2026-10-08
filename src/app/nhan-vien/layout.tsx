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
  { href: "/nhan-vien/khach-hang", label: "Khách hàng", icon: PeopleIcon },
  { href: "/nhan-vien/tai-khoan", label: "Tài khoản", icon: UserIcon },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const site = useSiteSettings();
  const [notes, setNotes] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    setNavOpen(false);
  }, [path]);
  const [me, setMe] = useState<DemoSession>({
    user: "nv.anh",
    role: "staff",
    name: "Nguyễn Minh Anh",
    title: "Nhân viên thẩm định",
  });
  useEffect(() => {
    const s = readSession();
    if (s) setMe(s);
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
                {waiting.length ? <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#e11d2e]" /> : null}
              </button>
              {notes && (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl bg-white p-3 text-zinc-800 shadow-xl">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">THÔNG BÁO</p>
                  {waiting.length === 0 ? <p className="px-1 py-2 text-sm text-zinc-500">Không có yêu cầu đang chờ.</p> : null}
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
            <button type="button" className="text-lg md:hidden" aria-label="Mở menu" onClick={() => setNavOpen(true)}>
              ☰
            </button>
            <Link href="/nhan-vien/tai-khoan" className="hidden items-center gap-2 sm:flex">
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
        {navOpen ? (
          <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setNavOpen(false)} />
        ) : null}
        <aside
          className={`${navOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden"} w-[min(260px,88vw)] flex-col border-r bg-white p-3 md:static md:flex md:min-h-[calc(100vh-58px)] md:w-[220px]`}
        >
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
            <Link href="/huong-dan/nhan-dien-dong-san-pham" className="mt-1 inline-block text-[#e11d2e]">
              Hướng dẫn nhận diện dòng máy
            </Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
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
function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2" stroke="currentColor" />
      <circle cx="11" cy="5.5" r="1.6" stroke="currentColor" />
      <path d="M2.5 12.5c.8-1.8 2-2.7 3.5-2.7s2.7.9 3.5 2.7M10 9.8c.8-.3 1.6-.4 2.2-.2 1 .3 1.7 1.2 2.3 2.9" stroke="currentColor" strokeLinecap="round" />
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
