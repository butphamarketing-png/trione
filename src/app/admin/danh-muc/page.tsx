import { AdminTable } from "@/components/admin-table";

const cats = ["Ipad", "Laptop", "Đồng hồ", "Macbook"];

export default function CategoryPage() {
  return (
    <AdminTable
      title="Danh sách Sản phẩm cấp 1"
      columns={["STT", "Tiêu đề", "Hiển thị"]}
      rows={cats.map((c, i) => [String(i + 1), c, "✓"])}
    />
  );
}
