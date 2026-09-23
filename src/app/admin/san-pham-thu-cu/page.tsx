import { AdminTable } from "@/components/admin-table";
import { lines, models } from "@/data/catalog";
import { vndComma } from "@/lib/pricing";

const emptyProblemPrices = ["Giá loại 2", "Giá loại 3", "Giá loại 4", "Giá loại 5"];

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
