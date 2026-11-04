"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionProvider } from "@/components/session-context";
import { confirmServerSession, type DemoSession } from "@/lib/session";

export default function ThuCuLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const confirmed = await confirmServerSession();
      if (cancelled) return;
      if (!confirmed) {
        const next = path === "/thu-cu" || path.startsWith("/thu-cu/") ? path : "/thu-cu";
        router.replace(`/dang-nhap?next=${encodeURIComponent(next)}`);
        return;
      }
      setSession(confirmed);
    })();
    return () => {
      cancelled = true;
    };
  }, [path, router]);

  if (!session) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f6f8] text-sm text-zinc-500">Đang kiểm tra đăng nhập...</div>;
  }

  return <SessionProvider value={session}>{children}</SessionProvider>;
}
