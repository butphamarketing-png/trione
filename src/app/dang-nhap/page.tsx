"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveLogin, saveSession } from "@/lib/session";
import { useMediaSrc } from "@/lib/use-live-media";
import { useSiteSettings } from "@/lib/site-settings";

export default function LoginPage() {
  const router = useRouter();
  const loginBg = useMediaSrc("login-bg", "/login-bg.png");
  const site = useSiteSettings();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setErr("Nhập tài khoản và mật khẩu.");
      return;
    }
    const catalog = await import("@/lib/catalog-sync");
    await catalog.hydrateCatalog();
    const session = resolveLogin(user, pass);
    if (!session) {
      setErr("Sai tài khoản, mật khẩu, hoặc tài khoản đã ngưng.");
      return;
    }
    saveSession(session);
    router.replace(session.role === "admin" ? "/admin" : "/nhan-vien");
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pt-[118px] pb-24">
        <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="mb-5 text-center text-[26px] font-bold">Đăng nhập</h1>
          <label className="mb-3 flex items-center gap-2 rounded-md border px-3 py-2.5">
            <span className="text-zinc-400">👤</span>
            <input
              name="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="flex-1 text-sm outline-none"
              placeholder="Tài khoản"
              autoComplete="username"
            />
          </label>
          <label className="mb-2 flex items-center gap-2 rounded-md border px-3 py-2.5">
            <span className="text-zinc-400">🔒</span>
            <input
              name="password"
              type={show ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="flex-1 text-sm outline-none"
              placeholder="Mật khẩu"
              autoComplete="current-password"
            />
            <button type="button" className="text-zinc-400" onClick={() => setShow((s) => !s)} aria-label="Hiện mật khẩu">
              👁
            </button>
          </label>
          {err && <p className="mb-3 text-xs text-[#e11d2e]">{err}</p>}
          <button className="w-full rounded-md bg-[#e11d2e] py-3 font-bold tracking-wide text-white">ĐĂNG NHẬP</button>
          <p className="mt-4 text-center text-[12px] leading-5 text-zinc-500">
            Trong trường hợp có vấn đề vui lòng truy cập
            <br />
            <span className="font-bold text-[#e11d2e]">{site.company}</span> để được hỗ trợ
          </p>
          <p className="mt-3 text-center text-[11px] text-zinc-400">Demo: nv.anh · sala.hcm · admin / 123456</p>
        </form>
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-[#e11d2e] px-6 py-2.5 text-[11px] font-semibold tracking-wide text-white">
        <span>{site.company}</span>
        <span className="text-center font-medium">{site.address}</span>
        <span>{site.slogan}</span>
      </div>
    </div>
  );
}
