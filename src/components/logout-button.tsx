"use client";

import { clearPrivateBrowserData, clearSession } from "@/lib/session";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void fetch("/api/logout", { method: "POST" })
          .catch(() => undefined)
          .finally(() => {
            try {
              clearSession();
              clearPrivateBrowserData();
            } catch {
              /* ignore */
            }
            window.location.assign("/dang-nhap");
          });
      }}
    >
      Đăng xuất
    </button>
  );
}
