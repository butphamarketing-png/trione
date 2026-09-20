import { AdminTable } from "@/components/admin-table";
import { models } from "@/data/catalog";
import { vndComma } from "@/lib/pricing";

export default function TradeInProductsPage() {
  return (
    <AdminTable
      title="Danh sách Sản phẩm thu cũ"
      redFrom={2}
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
      rows={models.map((m, i) => [
        String(i + 1),
        m.name,
        vndComma(m.prices[1]),
        vndComma(m.prices[2]),
        vndComma(m.prices[3]),
        vndComma(m.prices[4]),
        vndComma(m.prices[5]),
        "✓",
      ])}
    />
  );
}
