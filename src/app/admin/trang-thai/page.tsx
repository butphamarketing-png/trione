import { AdminTable } from "@/components/admin-table";
import { statusLabel } from "@/data/staff";

export default function Page() {
  return (
    <AdminTable
      title="Quản lý trạng thái đơn"
      columns={["STT", "Tiêu đề", "Hiển thị"]}
      rows={Object.values(statusLabel).map((v, i) => [String(i + 1), v, "✓"])}
    />
  );
}
