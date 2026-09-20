import { AdminTable } from "@/components/admin-table";
import { brands } from "@/data/catalog";

export default function HangPage() {
  return (
    <AdminTable
      title="Danh sách hãng"
      columns={["STT", "Tiêu đề", "Hiển thị"]}
      rows={[...brands.map((b, i) => [String(i + 1), b.name, "✓"]), ["9", "Mã Ngoài", "✓"], ["10", "Other", "✓"]]}
    />
  );
}
