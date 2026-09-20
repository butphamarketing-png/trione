"use client";

export function TrioneMark({
  size = 48,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center rounded-full border-[3px] font-extrabold leading-none ${
        light ? "border-white text-white" : "border-[#e11d2e] text-[#e11d2e] bg-black"
      }`}
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.16) }}
    >
      <span className="text-center tracking-tight">
        TRIONE
        <br />
        .VN
      </span>
    </div>
  );
}

export function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border ${
        on ? "border-[#e11d2e] bg-[#e11d2e] text-white" : "border-zinc-300 bg-white"
      }`}
    >
      {on ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6.2 4.6 9 10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

export function Stepper({ current, doneAll }: { current: number; doneAll?: boolean }) {
  return (
    <ol className="flex items-start justify-between mb-10 px-2" suppressHydrationWarning>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
        const done = doneAll || current > n;
        const active = !doneAll && current === n;
        return (
          <li key={n} className="flex-1 flex flex-col items-center relative" suppressHydrationWarning>
            {n < 9 && (
              <span
                className={`absolute left-[50%] top-[18px] h-[2px] w-full ${
                  done ? "bg-[#e11d2e]" : "bg-zinc-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                done
                  ? "bg-[#e11d2e] text-white"
                  : active
                    ? "bg-[#e11d2e] text-white"
                    : "bg-[#d9d9d9] text-white"
              }`}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 12 12">
                  <path d="M2 6.2 4.6 9 10 3" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              ) : (
                n
              )}
            </span>
            <span
              className={`mt-2 text-[10px] font-bold tracking-wide ${
                active || done ? "text-[#e11d2e]" : "text-zinc-400"
              }`}
            >
              BƯỚC {n}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StoreFooter() {
  return (
    <footer className="bg-[#0a0a0a] text-white mt-auto">
      <div className="mx-auto max-w-6xl px-8 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="mb-5 grid h-[88px] w-[88px] place-items-center rounded-full border-[5px] border-[#e11d2e] bg-transparent">
            <span className="text-center text-[11px] font-extrabold leading-tight">
              TRIONE.VN
            </span>
          </div>
          <p className="text-sm font-bold">ĐĂNG KÝ NHẬN TIN</p>
          <p className="text-xs text-zinc-400 mt-1 mb-3">Nhận ưu đãi và tin tức mới nhất từ TRIONE</p>
          <div className="flex border border-zinc-500 max-w-[220px]">
            <input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" placeholder="Email của bạn..." />
            <button className="px-3 text-lg" aria-label="Gửi">
              ➤
            </button>
          </div>
        </div>
        <div>
          <p className="font-bold mb-3">TRIONE.VN PHYSICAL STORE</p>
          <p className="text-[13px] text-zinc-400 leading-6">
            Địa chỉ: 300/41/13A Nguyễn Thái Sơn,
            <br />
            Phường Hạnh Thông, Thành phố Hồ Chí Minh, Việt Nam.
            <br />
            Email: trionevn@outlook.com
            <br />
            Hotline: <span className="text-white font-semibold">0705.825.888</span>
            <br />
            Website: https://trione.vn/
          </p>
        </div>
        <div>
          <p className="font-bold mb-3">VỀ CHÚNG TÔI</p>
          <ul className="space-y-1.5 text-[13px] text-zinc-400">
            {[
              "Giới thiệu về Trione.vn",
              "Nam",
              "Nữ",
              "Garmin",
              "Đồng hồ thể thao",
              "Dinh dưỡng",
              "Cũ người, mới ta",
              "Phụ kiện",
              "Tin tức - Sự kiện",
              "Hệ thống cửa hàng",
            ].map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold mb-3">CHÍNH SÁCH</p>
          <ul className="space-y-1.5 text-[13px] text-zinc-400">
            {[
              "Điều khoản sử dụng Trione Content Manager",
              "Chính sách bảo mật",
              "Chính sách thanh toán",
              "Chính sách vận chuyển và giao nhận",
              "Chính sách đổi trả và hoàn tiền",
              "Thông tin liên hệ & giải quyết khiếu nại",
              "Bảo hành toàn diện",
            ].map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="mx-auto max-w-6xl px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <span>Copyright ©2026 Trione.vn.</span>
          <div className="text-center">
            <p className="mb-2 font-semibold text-white/80">KẾT NỐI VỚI CHÚNG TÔI</p>
            <div className="flex justify-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1877f2] text-white">f</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0068ff] text-white text-[10px]">Zalo</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-yellow-400 to-pink-600 text-white">◎</span>
            </div>
          </div>
          <div className="text-right">
            <p className="mb-2 font-semibold text-white/80">HÌNH THỨC THANH TOÁN</p>
            <span className="inline-block rounded bg-white px-2 py-0.5 text-[#1a1f71] font-extrabold italic">VISA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WizardHeader() {
  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="/thu-cu" className="shrink-0">
          <TrioneMark size={52} light />
        </a>
        <div className="text-center">
          <p className="text-[20px] font-extrabold tracking-[0.08em]">CHƯƠNG TRÌNH THU CŨ ĐỒNG HỒ</p>
          <p className="text-[11px] tracking-[0.28em] text-zinc-400">ĐỊNH GIÁ NHANH · QUY TRÌNH MINH BẠCH</p>
        </div>
        <a href="/dang-nhap" className="flex items-center gap-2 text-sm">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" />
            </svg>
          </span>
          <span>
            <span className="block text-[12px] font-bold">
              TÀI KHOẢN <span className="text-[10px]">▾</span>
            </span>
            <span className="text-[11px] text-zinc-400">Thông tin cá nhân</span>
          </span>
        </a>
      </div>
      <div className="h-[3px] bg-[#e11d2e]" />
    </header>
  );
}
