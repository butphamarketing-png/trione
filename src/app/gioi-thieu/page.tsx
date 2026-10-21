"use client";

import Link from "next/link";
import { StoreFooter, WizardHeader } from "@/components/store-footer";
import { phoneHref, useSiteSettings } from "@/lib/site-settings";

export default function AboutPage() {
  const site = useSiteSettings();
  return (
    <div className="min-h-screen bg-[#f6f6f7] text-zinc-900">
      <WizardHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-zinc-500">
          <Link href="/thu-cu" className="text-[#e11d2e]">
            Thu cũ
          </Link>
          <span> / Giới thiệu</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold">Giới thiệu {site.company}</h1>
        <p className="mt-3 text-zinc-600">{site.description}</p>
        <article className="mt-8 space-y-8 rounded-2xl bg-white p-6 shadow-sm">
          <section>
            <h2 className="text-xl font-semibold">Thu cũ đổi mới</h2>
            <p className="mt-2 text-zinc-600">
              Khách chọn thương hiệu, dòng và mẫu trên trang thu cũ. Giá thu được tính theo tình trạng máy. Khi đổi máy mới, số tiền còn lại bằng giá niêm yết trừ giá thu cũ và trợ giá.
            </p>
            <Link href="/thu-cu" className="mt-3 inline-block font-medium text-[#e11d2e]">
              Bắt đầu thu cũ
            </Link>
          </section>
          <section id="cua-hang">
            <h2 className="text-xl font-semibold">Hệ thống cửa hàng</h2>
            <p className="mt-2 text-zinc-600">Địa chỉ: {site.address}</p>
            {site.hours ? <p className="mt-1 text-zinc-600">Giờ mở cửa: {site.hours}</p> : null}
            <p className="mt-1 text-zinc-600">
              Điện thoại:{" "}
              <a className="font-medium text-[#e11d2e]" href={phoneHref(site.phone)}>
                {site.phone}
              </a>
            </p>
            <p className="mt-1 text-zinc-600">
              Hotline:{" "}
              <a className="font-medium text-[#e11d2e]" href={phoneHref(site.hotline)}>
                {site.hotline}
              </a>
            </p>
            {site.email ? <p className="mt-1 text-zinc-600">Email: {site.email}</p> : null}
          </section>
        </article>
      </main>
      <StoreFooter />
    </div>
  );
}
