import { AdminTable } from "@/components/admin-table";
import { lines, models } from "@/data/catalog";
import { vndComma } from "@/lib/pricing";

const emptyProblemPrices = ["Giá loại 2", "Giá loại 3", "Giá loại 4", "Giá loại 5"];

const productPhotos: Record<string, string> = {
  "Apple Watch Ultra 2": "/watches/ultra-2.jpg",
  "Apple Watch Ultra": "/watches/ultra-1.jpg",
  "Apple Watch Series 10": "/watches/series-10.jpg",
  "Apple Watch Series 9": "/watches/series-9.jpg",
  "Apple Watch Series 8": "/watches/series-8.jpg",
  "Apple Watch Series 7": "/watches/series-7.jpg",
  "Apple Watch SE (2023)": "/watches/se-2.jpg",
  "Apple Watch SE (2020)": "/watches/se-2.jpg",
  "Garmin fēnix 7 Sapphire": "/watches/fenix-6x.jpg",
  "Garmin Forerunner 165": "/watches/forerunner-265.jpg",
  "Garmin Forerunner 970": "/watches/forerunner-970.jpg",
  "Samsung Galaxy Watch6": "/watches/galaxy-watch-6.jpg",
  "COROS PACE 3": "/watches/coros-pace-3.jpg",
  "Suunto Race 2": "/watches/suunto-t6c.jpg",
  "Amazfit GTR 4": "/watches/amazfit-bip.jpg",
  "Huawei Watch GT 5 Pro": "/watches/huawei-gt5.jpg",
  "Redmi Watch 5": "/brands/xiaomi.svg",
};

export default function TradeInProductsPage() {
  return (
    <AdminTable
      title="Danh sách Sản phẩm thu cũ"
      redFrom={2}
      presetVersion="tradein-prices-v1"
      blankColumns={emptyProblemPrices}
      filters={
        <>
          <select className="rounded border bg-white px-3 py-2 text-sm">
            <option>Chọn danh mục</option>
            <option>Đồng hồ</option>
          </select>
          <select className="rounded border bg-white px-3 py-2 text-sm">
            <option>Chọn hãng</option>
            <option>Apple</option>
            <option>Garmin</option>
            <option>Samsung</option>
          </select>
        </>
      }
      columns={["STT", "Tiêu đề", "Giá loại 1", "Giá loại 2", "Giá loại 3", "Giá loại 4", "Giá loại 5", "Hiển thị"]}
      defaultImages={productPhotos}
      codes={models.map((model) => model.id)}
      parents={models.map((model) => lines.find((line) => line.id === model.lineId)?.brandId ?? "")}
      subs={models.map((model) => model.lineId)}
      rows={models.map((m, i) => [
        String(i + 1),
        m.name,
        vndComma(m.prices[1]),
        "",
        "",
        "",
        "",
        "✓",
      ])}
    />
  );
}
