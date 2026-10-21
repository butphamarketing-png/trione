"use client";

import Link from "next/link";

const grades = [
  {
    level: "Loại 1",
    when: "Hoạt động tốt + màn hình xuất sắc + thân máy xuất sắc.",
    note: "Lấy mức xấu hơn giữa màn hình và thân máy. Cả hai xuất sắc → loại 1.",
  },
  {
    level: "Loại 2",
    when: "Màn hình dùng nhẹ, thân máy hao mòn thông thường, hoặc đúng 1 lỗi chức năng.",
    note: "Hoạt động tốt nhưng màn/thân nhẹ; hoặc có vấn đề với 1 lỗi.",
  },
  {
    level: "Loại 3",
    when: "Đúng 2 lỗi chức năng.",
    note: "Chỉ khi khách chọn “có vấn đề” và tick đúng 2 lỗi.",
  },
  {
    level: "Loại 4",
    when: "Màn hình hư, thân máy mòn nặng, hoặc từ 3 lỗi trở lên.",
    note: "Lấy mức xấu nhất giữa các tiêu chí đã chọn.",
  },
  {
    level: "Loại 5",
    when: "Đồng hồ không hoạt động.",
    note: "Luôn dùng giá loại 5, bỏ qua màn hình / thân máy.",
  },
];

export default function PricingRulesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
        <h1 className="mb-2 text-lg font-semibold">Rule định giá thu cũ đổi mới</h1>
        <p className="text-sm leading-6 text-zinc-500">
          Đây là rule đang chạy trên trang thu cũ. Khách không nhập giá — chỉ chọn mẫu và tình trạng. Giá lấy từ bảng sản phẩm trong admin.
        </p>
      </div>

      <section className="rounded-sm border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold">1. Giá thu cũ (máy khách mang đến)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>
            Mỗi sản phẩm thu cũ có <strong>5 mức giá cố định</strong> (Giá loại 1 → 5) tại{" "}
            <Link href="/admin/san-pham-thu-cu" className="font-medium text-[#2f6fed]">
              Sản phẩm thu cũ
            </Link>
            .
          </li>
          <li>Wizard chấm loại theo tình trạng, rồi lấy đúng ô giá của loại đó. Ô trống = 0 đ.</li>
          <li>
            Import hàng loạt tại{" "}
            <Link href="/admin/import" className="font-medium text-[#2f6fed]">
              Import / Export giá
            </Link>
            .
          </li>
        </ol>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Loại</th>
                <th className="px-3 py-2">Khi nào áp dụng</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((item) => (
                <tr key={item.level} className="border-t border-zinc-100 align-top">
                  <td className="px-3 py-3 font-semibold whitespace-nowrap">{item.level}</td>
                  <td className="px-3 py-3 text-zinc-600">
                    <p>{item.when}</p>
                    <p className="mt-1 text-xs text-zinc-400">{item.note}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-sm border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold">2. Giá khách cần trả khi đổi mới</h2>
        <p className="rounded-lg bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800">
          Giá tổng = giá niêm yết máy mới − giá thu cũ − trợ giá
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>
            <strong>Giá niêm yết</strong> và <strong>trợ giá</strong> lấy từ{" "}
            <Link href="/admin/doi-moi" className="font-medium text-[#2f6fed]">
              Sản phẩm đổi mới
            </Link>
            .
          </li>
          <li>Trợ giá để trống hoặc 0 thì không trừ thêm.</li>
          <li>Nếu kết quả âm thì hiển thị 0 (không hoàn thêm trên web).</li>
        </ul>
      </section>

      <section className="rounded-sm border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold">3. Đồng bộ giao diện khách</h2>
        <p className="text-sm leading-6 text-zinc-600">
          Sau khi lưu trong admin (hoặc import Excel), catalog được đẩy lên server. Trang thu cũ tải lại khi mở trang, focus lại tab, hoặc trong vòng khoảng một phút. Đổi tên/logo/SEO tại{" "}
          <Link href="/admin/thiet-lap" className="font-medium text-[#2f6fed]">
            Thiết lập thông tin
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
