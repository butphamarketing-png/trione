import { AdminTable } from "@/components/admin-table";
import { brands, lines } from "@/data/catalog";

const lineImages = Object.fromEntries(lines.map((line) => [line.name, line.image]));

export default function HangPage() {
  return (
    <AdminTable
      title="Danh mục cấp 2"
      columns={["STT", "Hình", "Tiêu đề", "Danh mục cấp 1", "Hiển thị"]}
      rows={lines.map((line, index) => [
        String(index + 1),
        "",
        line.name,
        brands.find((brand) => brand.id === line.brandId)?.name ?? "",
        "✓",
      ])}
      defaultImages={lineImages}
      codes={lines.map((line) => line.id)}
      parents={lines.map((line) => line.brandId)}
      presetVersion="lines-photos-v1"
    />
  );
}
