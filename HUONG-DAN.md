# Hướng dẫn sử dụng demo TRIONE.VN

Demo website chương trình **thu cũ đổi mới đồng hồ**: khách gửi yêu cầu định giá, nhân viên thẩm định, admin quản lý danh mục và đơn hàng.

## 1. Mở demo

**Trực tuyến:** [https://trione-umber.vercel.app](https://trione-umber.vercel.app)

**Chạy máy local:**

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — trang chủ tự chuyển sang wizard `/thu-cu`.

Windows dùng `next dev --webpack` (đã cấu hình trong `npm run dev`).

## 2. Tài khoản demo

Vào [Đăng nhập](https://trione-umber.vercel.app/dang-nhap). Mật khẩu chung: **`123456`**.

| Tài khoản   | Vai trò         | Vào cổng      |
|-------------|-----------------|---------------|
| `nv.anh`    | Nhân viên       | `/nhan-vien`  |
| `sala.hcm`  | Cộng tác viên   | `/nhan-vien` (nhãn Cổng CTV) |
| `admin`     | Quản trị        | `/admin`      |

Khách không cần đăng nhập để gửi yêu cầu thu cũ.

Dữ liệu phiên và đơn mới lưu trong **sessionStorage của tab trình duyệt**. Đóng tab hoặc mở cửa sổ ẩn danh khác sẽ không thấy đơn vừa gửi.

## 3. Cổng khách — 9 bước thu cũ đổi mới

Đường dẫn: `/thu-cu`

### Luồng chuẩn (máy có trong danh mục)

1. **Thương hiệu** — Apple, Samsung, Garmin, COROS, Suunto, Amazfit, Huawei, Xiaomi.
2. **Dòng máy** — ví dụ Apple Watch Ultra / Series / SE.
3. **Mẫu và kích thước** — chọn đúng model.
4. **IMEI / số sê-ri** — **không bắt buộc**, có thể bỏ trống. Nút **+ Tải ảnh từ máy** trên bước ảnh dùng để điền demo, không bắt buộc file thật.
5. **Chức năng** — hoạt động tốt / có vấn đề / không hoạt động.
   - Chọn **có vấn đề** → bước phụ chọn lỗi (GPS, nhịp tim, pin, cảm ứng…).
6. **Màn hình** — xuất sắc / xước nhẹ / hư hỏng.
7. **Thân máy** — xuất sắc / mòn nhẹ / hư nặng.
8. **Ảnh** — đủ **5 ảnh bắt buộc** (mặt trước, mặt sau, ngang trái, ngang phải, số serial). Bấm **+ TẢI ẢNH TỪ MÁY** để gắn ảnh demo rồi **Tiếp tục**.
9. **Chọn Garmin đổi mới** — giá thu cũ trừ vào giá niêm yết. Số **cần trả thêm** = giá Garmin − giá thu cũ (không âm).

Sau bước 9:

- Màn **Xác nhận** hiện mã yêu cầu dạng `TRI-YYMMDD-HHMM` và hiệu lực báo giá **07 ngày**.
- Tick **Tôi xác nhận thông tin trên là chính xác** rồi **GỬI YÊU CẦU ĐỔI MỚI**.
- Màn thành công có mã đơn; **Xem cổng nhân viên** mở chi tiết đơn đó.

### Thương hiệu khác

Nhập tên hãng (≥ 2 ký tự) → bỏ qua bước dòng/mẫu → IMEI → tình trạng → ảnh → Garmin. Giá thu cũ = 0, ghi chú thẩm định tại cửa hàng.

### Cách tính loại máy (demo)

Lấy **loại xấu nhất** trong các tiêu chí đã chọn (loại 1 tốt nhất → loại 5 kém nhất):

- Không hoạt động → **loại 5**.
- Chức năng tốt → loại 1; có vấn đề: 1 lỗi → 2, 2 lỗi → 3, ≥ 3 lỗi → 4.
- Màn/thân xuất sắc → 1; nhẹ → 2; hỏng/nặng → 4.
- Pin/dây đeo kém cũng kéo loại xuống.

Ví dụ demo: Apple Watch Ultra 2, tình trạng xuất sắc → **8.500.000 đ**; đổi fēnix 8 AMOLED 29.990.000 đ → **cần trả thêm 21.490.000 đ**.

## 4. Cổng nhân viên / CTV

Đăng nhập `nv.anh` hoặc `sala.hcm`.

| Trang | Việc làm |
|--------|----------|
| `/nhan-vien` | KPI, yêu cầu gần đây. Đơn mới từ wizard đứng đầu bảng, KPI tăng theo đơn live. |
| `/nhan-vien/yeu-cau` | Lọc theo trạng thái, tìm mã. |
| `/nhan-vien/yeu-cau/[mã]` | Xem máy cũ / Garmin / ảnh demo; đổi trạng thái; lưu ghi chú. |
| `/nhan-vien/khach-hang` | Danh sách khách + CTV; khách vừa gửi đơn (`khach.trione`) xuất hiện ở đây. |

**Trạng thái:** Chờ thẩm định → Đang xử lý → Đã gửi báo giá → Hoàn tất / Từ chối.

Chuông thông báo liệt kê đơn đang chờ hoặc đang xử lý.

## 5. Cổng admin CMS

Đăng nhập `admin` → `/admin`.

| Menu | Nội dung |
|------|----------|
| Bảng điều khiển | KPI + đơn gần đây |
| Danh mục cấp 1 / Hãng | Cây danh mục thu cũ |
| Sản phẩm thu cũ | Bảng giá 5 loại |
| Import | Tải `.csv` để xem số dòng/cột (`.xlsx` chỉ nhận file, không parse). Nút Import không ghi database. |
| Sản phẩm đổi mới | Catalog Garmin |
| Tình trạng máy / Option / Trạng thái | Cấu hình demo |
| Đơn hàng | Toàn bộ yêu cầu (kể cả đơn vừa gửi) |
| Hình ảnh · video | Media demo |
| Quản lý user | Thêm user demo (Admin / Nhân viên / CTV) |
| Thiết lập thông tin | Thông tin cửa hàng demo |

Nút **Export Excel** trên bảng CMS xuất file CSV (UTF-8).

## 6. Kịch bản test nhanh

1. Mở `/thu-cu` → Apple → Ultra → Ultra 2 → có thể bỏ trống IMEI hoặc nhập `H1X9Q7ABCDEF`.
2. Chức năng tốt → màn/thân xuất sắc → **+ TẢI ẢNH TỪ MÁY** → đủ 5/5 → Tiếp tục.
3. Giữ fēnix 8 AMOLED → Xem báo giá → xác nhận → gửi. Ghi lại mã `TRI-…`.
4. Cùng tab trình duyệt, mở `/nhan-vien` (hoặc bấm Xem cổng nhân viên): đơn mới trên cùng, KPI tổng > 128.
5. Vào chi tiết đơn → đổi **Đang xử lý** → Cập nhật trạng thái → lưu ghi chú.
6. `/nhan-vien/khach-hang`: có `khach.trione`.
7. Đăng xuất → `admin` / `123456` → `/admin/don-hang`: thấy cùng mã đơn.

## 7. Lưu ý demo

- Không có backend / database thật. Đơn mới chỉ tồn tại trong tab hiện tại.
- Ảnh thiết bị là placeholder; bấm tải ảnh là gắn cờ “đã thêm (demo)”.
- Import Excel đầy đủ (xlsx) chưa có thư viện parse.
- Catalog, persona pin/dây đeo chưa chốt theo file giá cuối cùng của TRIONE.
- GitHub: [https://github.com/butphamarketing-png/trione](https://github.com/butphamarketing-png/trione)
