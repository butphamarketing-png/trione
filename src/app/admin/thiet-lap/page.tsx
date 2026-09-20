"use client";

import { useState } from "react";

export default function Page() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="max-w-xl space-y-3 rounded-sm border-t-4 border-[#2f6fed] bg-white p-6 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <h1 className="text-base font-semibold">Thiết lập thông tin</h1>
      <label className="block">
        Tên site
        <input className="mt-1 w-full rounded border px-3 py-2" defaultValue="TRIONE.VN" />
      </label>
      <label className="block">
        Hotline
        <input className="mt-1 w-full rounded border px-3 py-2" defaultValue="0705.825.888" />
      </label>
      <label className="block">
        Email
        <input className="mt-1 w-full rounded border px-3 py-2" defaultValue="trionevn@outlook.com" />
      </label>
      <label className="block">
        Địa chỉ showroom
        <textarea
          className="mt-1 w-full rounded border px-3 py-2"
          defaultValue="300/41/13A Nguyễn Thái Sơn, Phường Hạnh Thông, TP. Hồ Chí Minh"
        />
      </label>
      <label className="block">
        Hiệu lực báo giá (ngày)
        <input className="mt-1 w-full rounded border px-3 py-2" defaultValue="7" />
      </label>
      <label className="block">
        Slogan
        <input className="mt-1 w-full rounded border px-3 py-2" defaultValue="CHẠY KHI CÒN THỂ" />
      </label>
      <button className="rounded bg-[#2f6fed] px-4 py-2 text-white">Lưu (demo)</button>
      {saved && <p className="text-sm text-emerald-700">Đã lưu thiết lập trên trình duyệt demo.</p>}
    </form>
  );
}
