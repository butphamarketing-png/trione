"use client";

import Link from "next/link";
import { StoreFooter, WizardHeader } from "@/components/store-footer";
import { phoneHref, useSiteSettings } from "@/lib/site-settings";

const sections = [
  {
    id: "dieu-khoan",
    title: "Điều khoản sử dụng",
    body: "Trang quản trị dùng để cập nhật danh mục, giá thu cũ, trợ giá và yêu cầu của khách. Tài khoản nhân viên do quản trị cấp. Không chia sẻ mật khẩu đăng nhập.",
  },
  {
    id: "bao-mat",
    title: "Chính sách bảo mật",
    body: "Thông tin khách nhập khi gửi yêu cầu thu cũ gồm họ tên, số điện thoại, địa chỉ và ảnh máy. Cửa hàng dùng các thông tin này để liên hệ và thẩm định. Ảnh sản phẩm trong trang quản trị phục vụ hiển thị trên trang thu cũ.",
  },
  {
    id: "thanh-toan",
    title: "Chính sách thanh toán",
    body: "Số tiền khách cần bù khi đổi máy mới là giá niêm yết trừ giá thu cũ và trợ giá. Thanh toán được thực hiện khi giao dịch tại cửa hàng.",
  },
  {
    id: "van-chuyen",
    title: "Chính sách vận chuyển và giao nhận",
    body: "Khách mang đồng hồ đến cửa hàng để nhân viên kiểm tra tình trạng thực tế. Địa chỉ và giờ mở cửa nằm ở mục hệ thống cửa hàng.",
  },
  {
    id: "doi-tra",
    title: "Chính sách đổi trả và hoàn tiền",
    body: "Giá trên trang thu cũ là báo giá theo mẫu và tình trạng khách chọn. Giá chốt sau khi cửa hàng kiểm tra máy. Nếu tình trạng khác với lựa chọn trên web, giá thu được điều chỉnh theo bảng giá đang lưu.",
  },
  {
    id: "lien-he",
    title: "Thông tin liên hệ và giải quyết khiếu nại",
    body: "Khách gọi hotline hoặc gửi email cho cửa hàng khi cần đối soát yêu cầu thu cũ. Mã yêu cầu được cấp sau khi gửi form.",
  },
  {
    id: "bao-hanh",
    title: "Bảo hành toàn diện",
    body: "Máy đổi mới được bảo hành theo chính sách của hãng tại cửa hàng. Máy thu cũ được mô tả đúng tình trạng đã chọn lúc gửi yêu cầu.",
  },
];

export default function PolicyPage() {
  const site = useSiteSettings();
  return (
    <div className="min-h-screen bg-[#f6f6f7] text-zinc-900">
      <WizardHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-zinc-500">
          <Link href="/thu-cu" className="text-[#e11d2e]">
            Thu cũ
          </Link>
          <span> / Chính sách</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold">Chính sách {site.company}</h1>
        <p className="mt-3 text-zinc-600">
          Liên hệ {site.hotline} hoặc {site.email}. Cửa hàng: {site.address}.
        </p>
        <article className="mt-8 space-y-8 rounded-2xl bg-white p-6 shadow-sm">
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 text-zinc-600">{section.body}</p>
            </section>
          ))}
          <p>
            <a className="font-medium text-[#e11d2e]" href={phoneHref(site.hotline)}>
              Gọi {site.hotline}
            </a>
          </p>
        </article>
      </main>
      <StoreFooter />
    </div>
  );
}
