"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/store-footer";
import { useSiteSettings } from "@/lib/site-settings";
import { LogoutButton } from "@/components/logout-button";
import { readSession } from "@/lib/session";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; children: NavItem[] };

const dashboard: NavItem = { href: "/admin", label: "Bảng điều khiển" };
const groups: NavGroup[] = [
  {
    label: "Quản lý Sản phẩm thu cũ",
    children: [
      { href: "/admin/danh-muc", label: "Danh mục cấp 1" },
      { href: "/admin/hang", label: "Danh mục cấp 2" },
      { href: "/admin/san-pham-thu-cu", label: "Sản phẩm thu cũ" },
      { href: "/admin/import", label: "Import" },
    ],
  },
  {
    label: "Quản lý Sản phẩm đổi mới",
    children: [{ href: "/admin/doi-moi", label: "Sản phẩm đổi mới" }],
  },
  {
    label: "Quản lý Tình trạng máy",
    children: [{ href: "/admin/tinh-trang", label: "Tình trạng máy" }],
  },
  {
    label: "Quản lý Option",
    children: [{ href: "/admin/option", label: "Option" }],
  },
  {
    label: "Quản lý đơn hàng",
    children: [
      { href: "/admin/don-hang", label: "Đơn hàng" },
      { href: "/admin/trang-thai", label: "Tình trạng đơn hàng" },
    ],
  },
  {
    label: "Quản lý hình ảnh · video",
    children: [{ href: "/admin/media", label: "Hình ảnh · video" }],
  },
];
const tail: NavItem[] = [
  { href: "/admin/users", label: "Quản lý user" },
  { href: "/admin/thiet-lap", label: "Thiết lập thông tin" },
];

function isActive(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path.startsWith(href);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const current = useMemo(() => {
    const all = [dashboard, ...groups.flatMap((g) => g.children), ...tail];
    return all.find((i) => isActive(path, i.href));
  }, [path]);
  const currentGroup = groups.find((g) => g.children.some((c) => isActive(path, c.href)));
  const [open, setOpen] = useState<string>(currentGroup?.label ?? "Quản lý Sản phẩm thu cũ");
  const [hello, setHello] = useState("admin");
  const site = useSiteSettings();
  useEffect(() => {
    const s = readSession();
    if (s) setHello(s.user);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="flex">
        <aside className="min-h-screen w-[248px] border-r border-zinc-200 bg-white p-3 text-zinc-700">
          <Link href="/" className="mb-5 flex items-center gap-2 px-1 py-2">
            <BrandLogo size={42} />
            <span>
              <span className="block text-[10px] tracking-[0.2em] text-zinc-400">CMS</span>
              <span className="font-extrabold text-zinc-900">{site.company}</span>
            </span>
          </Link>
          <Link
            href={dashboard.href}
            className={`mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${
              isActive(path, dashboard.href) ? "bg-[#fff4c2] font-medium text-zinc-900" : "hover:bg-zinc-50"
            }`}
          >
            ▦ {dashboard.label}
          </Link>
          {groups.map((g) => {
            const childActive = g.children.some((c) => isActive(path, c.href));
            const expanded = open === g.label || childActive;
            return (
              <div key={g.label} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => setOpen(expanded && open === g.label ? "" : g.label)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] ${
                    childActive ? "bg-[#fff4c2] font-medium text-zinc-900" : "hover:bg-zinc-50"
                  }`}
                >
                  <span>{g.label}</span>
                  <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
                </button>
                {expanded && (
                  <div className="ml-3 border-l border-zinc-200 py-1 pl-2">
                    {g.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`mb-0.5 flex items-center rounded px-2 py-1.5 text-[12px] ${
                          isActive(path, c.href) ? "border-l-2 border-[#f6c445] font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {tail.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${
                isActive(path, i.href) ? "bg-[#fff4c2] font-medium text-zinc-900" : "hover:bg-zinc-50"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-2.5 text-sm">
            <span className="text-zinc-500">☰ &nbsp; Xin chào, {hello}!</span>
            <div className="flex items-center gap-4 text-zinc-500">
              <span>SEO</span>
              <span>⚙</span>
              <span className="relative">
                🔔<span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#e11d2e]" />
              </span>
              <LogoutButton className="text-[#2f6fed]" />
            </div>
          </header>
          <div className="px-6 pt-4">
            <p className="inline-block border-b-2 border-[#f6c445] pb-1 text-sm font-medium text-zinc-800">
              Bảng điều khiển
              {currentGroup ? ` / ${currentGroup.label}` : ""}
              {current && current.href !== "/admin" ? ` / ${current.label}` : ""}
            </p>
          </div>
          <div className="p-6 pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
