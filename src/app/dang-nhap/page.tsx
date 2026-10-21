"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/store-footer";
import { resolveLogin, saveSession } from "@/lib/session";
import { useMediaSrc } from "@/lib/use-live-media";
import { useSiteSettings } from "@/lib/site-settings";

export default function LoginPage() {
  const router = useRouter();
  const loginBg = useMediaSrc("login-bg", "");
  const site = useSiteSettings();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!user.trim() || !pass) {
      setErr("Nhập tài khoản và mật khẩu.");
      return;
    }
    setBusy(true);
    setErr("");
    const catalog = await import("@/lib/catalog-sync");
    await catalog.publishCatalogNow();
    await catalog.hydrateCatalog({ force: true });
    const session = resolveLogin(user, pass);
    if (session) {
      saveSession(session);
      router.replace(session.role === "admin" ? "/admin" : "/nhan-vien");
      return;
    }
    // Server kiểm tra catalog trước; mật khẩu môi trường chỉ dùng khi chưa có tài khoản quản trị.
    const apiLogin = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    }).catch(() => null);
    if (apiLogin?.ok) {
      const data = (await apiLogin.json()) as {
        session?: { user: string; role: "admin" | "staff"; name: string; title: string };
      };
      if (data.session) {
        saveSession(data.session);
        router.replace(data.session.role === "admin" ? "/admin" : "/nhan-vien");
        return;
      }
    }
    setBusy(false);
    setErr("Sai tài khoản, mật khẩu, hoặc tài khoản đã ngưng.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden" suppressHydrationWarning>
      <div
        className="absolute inset-0 bg-[#111] bg-cover bg-center"
        style={loginBg ? { backgroundImage: `url(${loginBg})` } : undefined}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3a1518_0%,rgba(10,10,10,0.82)_42%,rgba(8,8,8,0.94)_100%)]" />
      <div className="relative flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <form onSubmit={submit} className="w-full max-w-[420px] rounded-3xl border border-white/70 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-8">
            <div className="mb-6 flex flex-col items-center text-center">
              {ready && site.logo ? (
                <span className="inline-flex rounded-2xl bg-[#161616] px-5 py-3">
                  <img src={site.logo} alt={site.company} className="h-12 w-auto max-w-[200px] object-contain" />
                </span>
              ) : (
                <BrandLogo size={72} />
              )}
              <p className="mt-4 text-[11px] font-bold tracking-[0.22em] text-[#e11d2e] uppercase" suppressHydrationWarning>
                {site.company}
              </p>
              <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-zinc-950">Đăng nhập</h1>
              <p className="mt-1 text-sm text-zinc-500">Vào khu vực quản lý thu cũ và đơn hàng</p>
            </div>

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Tài khoản</span>
              <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 focus-within:border-[#e11d2e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#e11d2e]/10">
                <UserIcon />
                <input
                  name="username"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  placeholder="Nhập tài khoản"
                  autoComplete="username"
                />
              </span>
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-600">Mật khẩu</span>
              <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 focus-within:border-[#e11d2e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#e11d2e]/10">
                <LockIcon />
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
                <button type="button" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900" onClick={() => setShow((s) => !s)}>
                  {show ? "Ẩn" : "Hiện"}
                </button>
              </span>
            </label>

            {err ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#e11d2e]">{err}</p> : null}

            <button
              disabled={busy}
              className="w-full rounded-xl bg-[#e11d2e] py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_24px_rgba(225,29,46,0.28)] transition hover:bg-[#c01020] disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            </button>

            <p className="mt-5 text-center text-[12px] leading-5 text-zinc-500">
              Cần hỗ trợ, liên hệ{" "}
              <span className="font-bold text-[#e11d2e]" suppressHydrationWarning>
                {site.company}
              </span>
            </p>
          </form>
        </main>

        <footer className="bg-[#e11d2e] px-4 py-3 text-center text-[11px] font-semibold tracking-wide text-white sm:px-6">
          <p suppressHydrationWarning>{site.company}</p>
          <p className="mt-0.5 font-medium text-white/90" suppressHydrationWarning>
            {site.address}
          </p>
        </footer>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-zinc-400">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-zinc-400">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
