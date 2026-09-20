"use client";

import { useMediaSrc } from "@/lib/use-live-media";

export function WatchFace({
  face = "#222",
  strap = "#c45a28",
  time = "10:09",
  size = 88,
}: {
  face?: string;
  strap?: string;
  time?: string;
  size?: number;
}) {
  const bezel = size * 0.82;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 1.28 }}>
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 rounded-sm"
        style={{ width: size * 0.22, height: size * 0.22, background: strap }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-sm"
        style={{ width: size * 0.22, height: size * 0.22, background: strap }}
      />
      <div
        className="absolute top-[14%] left-1/2 grid -translate-x-1/2 place-items-center rounded-[28%] border-[5px] border-zinc-800 shadow-inner"
        style={{ width: bezel, height: bezel, background: face }}
      >
        <span className="font-semibold tracking-tight text-white" style={{ fontSize: size * 0.18 }}>
          {time}
        </span>
      </div>
    </div>
  );
}

function RoundWatch({
  face,
  time,
  size = 64,
  bezel = "#1a1a1a",
}: {
  face: string;
  time: string;
  size?: number;
  bezel?: string;
}) {
  return (
    <div
      className="grid place-items-center rounded-full shadow-sm"
      style={{
        width: size,
        height: size,
        background: face,
        boxShadow: `0 0 0 5px ${bezel}, 0 8px 16px rgba(0,0,0,.12)`,
      }}
    >
      <span className="font-semibold tracking-tight text-white" style={{ fontSize: size * 0.22, color: face.startsWith("#e") || face.startsWith("#f") || face.startsWith("#c") ? "#1a1a1a" : "#fff" }}>
        {time}
      </span>
    </div>
  );
}

const lineFallback: Record<string, string> = {
  ultra: "/watches/line-ultra.png",
  series: "/watches/line-series.png",
  se: "/watches/line-se.png",
};

export function LineThumb({ kind }: { kind: string }) {
  const src = useMediaSrc(`line:${kind}`, lineFallback[kind] ?? "");
  if (src) {
    return <img src={src} alt="" className="h-[92px] w-[120px] shrink-0 rounded-xl bg-[#f4f4f5] object-cover" />;
  }
  if (kind === "ultra") {
    return (
      <div className="relative h-[92px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-[#111]">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/40 to-black" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <WatchFace face="#2a2a28" strap="#c45a28" time="10:09" size={78} />
        </div>
      </div>
    );
  }
  if (kind === "series") {
    return (
      <div className="relative h-[92px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-[#1a1210]">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#3a1c18] to-[#111]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <WatchFace face="#111" strap="#d4574a" time="10:09" size={78} />
        </div>
      </div>
    );
  }
  if (kind === "se") {
    return (
      <div className="relative h-[92px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-white">
        <div className="absolute left-2 top-3">
          <WatchFace face="#d9a7c7" strap="#e8b7d4" time="" size={42} />
        </div>
        <div className="absolute right-3 top-2">
          <WatchFace face="#111" strap="#222" time="10:09" size={48} />
        </div>
        <div className="absolute bottom-1 left-8">
          <WatchFace face="#2f6b3a" strap="#3d8a4c" time="" size={40} />
        </div>
        <span className="absolute right-2 bottom-2 h-4 w-4 rounded-full bg-orange-400" />
        <span className="absolute left-10 top-2 h-3 w-3 rounded-full bg-sky-400" />
      </div>
    );
  }
  return (
    <div className="grid h-[92px] w-[120px] shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-900">
      <WatchFace
        face={kind === "android" ? "#0b3d3a" : "#203040"}
        strap={kind === "sport" ? "#8899aa" : "#222"}
        time="10:09"
        size={70}
      />
    </div>
  );
}

const garminFallback: Record<string, string> = {
  fenix8: "/watches/g-fenix.png",
  fr970: "/watches/g-fr970.png",
};

export function GarminThumb({
  id,
  face,
  strap: _strap,
  time,
  size = 64,
}: {
  id?: string;
  face: string;
  strap: string;
  time: string;
  size?: number;
}) {
  const src = useMediaSrc(id ? `garmin:${id}` : "", garminFallback[id ?? ""] ?? "");
  if (src) {
    return (
      <div className="grid h-full min-h-[72px] w-full min-w-[72px] place-items-center overflow-hidden rounded-xl bg-[#f3f3f4]">
        <img src={src} alt="" className="h-full w-full object-contain" />
      </div>
    );
  }
  return (
    <div className="grid h-full min-h-[72px] w-full min-w-[72px] place-items-center rounded-xl bg-[#f3f3f4]">
      <RoundWatch face={face} time={time} size={size} />
    </div>
  );
}

const modelSrc: Record<string, string> = {
  ultra2: "/watches/model-ultra2.png",
  ultra1: "/watches/model-ultra1.png",
};

export function ModelThumb({ id }: { id: string }) {
  const src = useMediaSrc(`model:${id}`, modelSrc[id] ?? "");
  if (src) {
    return <img src={src} alt="" className="h-[88px] w-[160px] shrink-0 rounded-xl bg-[#f4f4f5] object-contain" />;
  }
  return (
    <div className="flex h-[88px] w-[160px] shrink-0 items-center justify-center gap-1 rounded-xl bg-[#f4f4f5]">
      <WatchFace face="#c8c4bc" strap="#d9d3c7" time="" size={64} />
      <WatchFace face="#222" strap="#c45a28" time="10:09" size={64} />
    </div>
  );
}
