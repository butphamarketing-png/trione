import { AdminTable } from "@/components/admin-table";

export default function Page() {
  return (
    <AdminTable
      title="Quản lý Option"
      columns={["STT", "Tiêu đề", "Hiển thị"]}
      rows={[
        ["1", "GPS", "✓"],
        ["2", "Cellular / LTE", "✓"],
        ["3", "Sapphire", "✓"],
        ["4", "AMOLED", "✓"],
        ["5", "Titanium", "✓"],
        ["6", "Solar", "✓"],
        ["7", "MIP", "✓"],
        ["8", "Pin", "✓"],
        ["9", "Dây đeo", "✓"],
      ]}
    />
  );
}
