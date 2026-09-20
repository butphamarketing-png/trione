export default function Page() {
  const items = [
    { src: "/watches/line-ultra.png", label: "Apple Watch Ultra" },
    { src: "/watches/line-series.png", label: "Apple Watch Series" },
    { src: "/watches/line-se.png", label: "Apple Watch SE" },
    { src: "/watches/model-ultra2.png", label: "Ultra 2" },
    { src: "/watches/g-fenix.png", label: "fēnix 8" },
    { src: "/watches/g-fr970.png", label: "Forerunner 970" },
    { src: "/login-bg.png", label: "Banner đăng nhập" },
  ];
  return (
    <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold">Quản lý hình ảnh · video</h1>
        <button className="rounded bg-[#2f6fed] px-3 py-2 text-sm text-white">+ Tải lên</button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="overflow-hidden rounded-lg border bg-zinc-50">
            <img src={it.src} alt="" className="h-28 w-full object-cover" />
            <p className="px-2 py-2 text-xs text-zinc-600">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
