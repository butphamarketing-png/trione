"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readSession } from "@/lib/session";

export default function ThuCuLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!readSession()) {
      const next = path === "/thu-cu" || path.startsWith("/thu-cu/") ? path : "/thu-cu";
      router.replace(`/dang-nhap?next=${encodeURIComponent(next)}`);
      return;
    }
    setAllowed(true);
  }, [path, router]);

  if (!allowed) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f6f8] text-sm text-zinc-500">Đang kiểm tra đăng nhập...</div>;
  }

  return children;
}
