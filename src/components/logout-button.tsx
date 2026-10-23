"use client";

import { useRouter } from "next/navigation";
import { clearPrivateBrowserData, clearSession } from "@/lib/session";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void import("@/lib/catalog-sync")
          .then((mod) => mod.publishCatalogNow())
          .finally(() => fetch("/api/logout", { method: "POST" }).catch(() => undefined))
          .finally(() => {
            clearSession();
            clearPrivateBrowserData();
            router.push("/dang-nhap");
          });
      }}
    >
      Đăng xuất
    </button>
  );
}
