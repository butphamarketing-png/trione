import { AdminTable } from "@/components/admin-table";
import { garminNew } from "@/data/catalog";
import { vndComma } from "@/lib/pricing";

export default function NewProductsPage() {
  return (
    <AdminTable
      title="Sản phẩm đổi mới"
      redFrom={5}
      columns={["STT", "Hình", "Tiêu đề", "Danh mục cấp 1", "Series", "Giá niêm yết", "Hiển thị"]}
      codes={garminNew.map((item) => item.id)}
      parents={garminNew.map(() => "garmin")}
      rows={garminNew.map((item, index) => [
        String(index + 1),
        "",
        item.name,
        "Garmin",
        item.series,
        vndComma(item.listPrice),
        "✓",
      ])}
    />
  );
}
