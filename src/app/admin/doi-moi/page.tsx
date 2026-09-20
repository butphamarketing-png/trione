import { AdminTable } from "@/components/admin-table";
import { garminNew } from "@/data/catalog";
import { vndComma } from "@/lib/pricing";

export default function NewProductsPage() {
  return (
    <AdminTable
      title="Sản phẩm đổi mới (2 cấp: hãng → sản phẩm)"
      redFrom={3}
      columns={["STT", "Tên", "Series", "Giá niêm yết"]}
      rows={garminNew.map((g, i) => [String(i + 1), g.name, g.series, vndComma(g.listPrice)])}
    />
  );
}
