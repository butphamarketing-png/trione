import Link from "next/link";
import { SiteSupportNote, StoreFooter, WizardHeader } from "@/components/store-footer";
import { GuideSeo } from "./seo";

export default function LineGuidePage() {
  return (
    <div className="min-h-screen bg-[#f6f6f7] text-zinc-900">
      <GuideSeo />
      <WizardHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-zinc-500">
          <Link href="/thu-cu" className="text-[#e11d2e]">
            Thu cũ
          </Link>
          <span> / Hướng dẫn</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold">Không biết dòng sản phẩm nào? Làm theo các bước này</h1>
        <p className="mt-3 text-zinc-600">
          Bài viết giúp bạn nhận đúng dòng đồng hồ trước khi chọn ở bước 2. Bạn không cần tháo máy. Chỉ cần xem mặt lưng, hộp, hoặc ứng dụng đang kết nối.
        </p>

        <article className="mt-8 space-y-8 rounded-2xl bg-white p-6 shadow-sm">
          <section>
            <h2 className="text-xl font-semibold">1. Xem tên in trên đồng hồ hoặc hộp</h2>
            <p className="mt-2 text-zinc-600">
              Lật nhẹ mặt lưng. Nhiều máy in sẵn tên dòng, cỡ mặt và số model. Hộp và hóa đơn thường ghi đúng tên bán ra, ví dụ Apple Watch Ultra 2, Galaxy Watch6, fēnix 7.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">2. Mở ứng dụng đang kết nối với đồng hồ</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-zinc-600">
              <li>Apple: trên iPhone mở ứng dụng Watch, vào tab Đồng hồ của tôi. Tên dòng nằm ngay dưới hình ảnh máy.</li>
              <li>Samsung: mở Galaxy Wearable hoặc Wearable. Tên máy nằm ở đầu màn hình.</li>
              <li>Garmin: mở Garmin Connect, vào thiết bị. Tên dòng như fēnix hoặc Forerunner hiện ở tiêu đề.</li>
              <li>COROS, Suunto, Amazfit, Huawei, Xiaomi: mở ứng dụng chính hãng đã dùng để ghép đôi. Mục thiết bị hoặc đồng hồ của tôi ghi tên mẫu.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold">3. Phân biệt nhanh một số dòng hay gặp</h2>
            <h3 className="mt-3 text-base font-semibold">Các hãng thường gặp</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-zinc-600">
              <li>Apple Watch Ultra: vỏ titanium, nút Action màu cam, mặt khoảng 49 mm.</li>
              <li>Apple Watch Series: núm Digital Crown, nhiều cỡ 41, 42, 45 hoặc 46 mm tùy thế hệ.</li>
              <li>Apple Watch SE: ít tính năng hơn Series cùng năm, không có màn hình Always-On.</li>
              <li>Samsung Galaxy Watch: mặt tròn, hệ điều hành Wear OS hoặc One UI Watch, tên thường bắt đầu bằng Galaxy Watch.</li>
              <li>Garmin fēnix: đồng hồ thể thao ngoài trời, nhiều nút bấm quanh vỏ. Forerunner nghiêng về chạy bộ, thân máy nhẹ hơn.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold">4. Vẫn chưa chắc</h2>
            <p className="mt-2 text-zinc-600">
              Quay lại trang thu cũ, chọn đúng thương hiệu ở bước 1, rồi chọn dòng gần giống nhất. Nếu máy không thuộc các hãng trong danh sách, chọn Thương hiệu khác và ghi tên bạn nhìn thấy trên vỏ. Nhân viên TRIONE.VN sẽ đối chiếu lại khi nhận máy.
            </p>
            <SiteSupportNote />
          </section>
        </article>

        <Link
          href="/thu-cu"
          className="mt-8 inline-block rounded-xl bg-[#e11d2e] px-6 py-3 font-semibold text-white"
        >
          Quay lại chọn dòng sản phẩm
        </Link>
      </main>
      <StoreFooter />
    </div>
  );
}
