import { AdminTable } from "@/components/admin-table";

export default function Page() {
  return (
    <AdminTable
      title="Quản lý tình trạng máy"
      columns={["STT", "Tiêu đề", "Hiển thị"]}
      rows={[
        ["1", "Xuất sắc / như mới", "✓"],
        ["2", "Đã qua sử dụng nhẹ", "✓"],
        ["3", "Hao mòn thông thường", "✓"],
        ["4", "Hư hỏng", "✓"],
        ["5", "Không hoạt động", "✓"],
      ]}
    />
  );
}
