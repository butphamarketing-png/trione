"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        clearSession();
        router.push("/dang-nhap");
      }}
    >
      Đăng xuất
    </button>
  );
}
