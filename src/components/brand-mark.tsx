export function BrandMark({ id }: { id: string }) {
  if (id === "apple") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-black text-white" aria-hidden>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1-.1.8-2.3 1.7-3.4-.7-.3-2-1.2-2-2.1zM14.8 6.4c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2.1-.6 2.7-1.4z" />
        </svg>
      </span>
    );
  }
  if (id === "samsung") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f3f6fb]" aria-hidden>
        <svg viewBox="0 0 88 18" width="46" height="14">
          <text x="44" y="14" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1428a0" fontFamily="Arial, sans-serif" letterSpacing="0.4">
            SAMSUNG
          </text>
        </svg>
      </span>
    );
  }
  if (id === "garmin") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f2f7fb]" aria-hidden>
        <svg viewBox="0 0 80 18" width="44" height="14">
          <text x="40" y="14" textAnchor="middle" fontSize="13" fontWeight="800" fill="#007cc3" fontFamily="Arial, sans-serif" letterSpacing="1">
            GARMIN
          </text>
        </svg>
      </span>
    );
  }
  if (id === "coros") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white" aria-hidden>
        <span className="flex items-center gap-0.5 text-[9px] font-extrabold tracking-tight text-[#e11d2e]">
          <svg viewBox="0 0 16 16" width="12" height="12">
            <circle cx="8" cy="8" r="6" fill="none" stroke="#e11d2e" strokeWidth="2.2" />
            <path d="M8 4.2v7.6M5.4 8h5.2" stroke="#e11d2e" strokeWidth="1.6" />
          </svg>
          COROS
        </span>
      </span>
    );
  }
  if (id === "suunto") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f6f6f6]" aria-hidden>
        <span className="text-[9px] font-black tracking-[0.22em] text-zinc-900">SUUNTO</span>
      </span>
    );
  }
  if (id === "amazfit") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7f7f7]" aria-hidden>
        <span className="text-[13px] font-semibold lowercase text-[#ff6a00]">amazfit</span>
      </span>
    );
  }
  if (id === "huawei") {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ffe8f0] text-[#e31c5f]" aria-hidden>
        <svg viewBox="0 0 48 48" width="30" height="30" fill="currentColor">
          <path d="M24 4c1.6 8.2 7.6 14.2 16 16-8.4 1.8-14.4 7.8-16 16-1.6-8.2-7.6-14.2-16-16 8.4-1.8 14.4-7.8 16-16z" />
        </svg>
      </span>
    );
  }
  if (id === "xiaomi") {
    return (
      <span className="grid h-14 w-14 place-items-center" aria-hidden>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ff6900] text-[15px] font-extrabold tracking-tight text-white">
          MI
        </span>
      </span>
    );
  }
  return (
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-xl text-[#e11d2e]" aria-hidden>
      +
    </span>
  );
}
