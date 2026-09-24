import { AdminTable } from "@/components/admin-table";
import { brands, lines } from "@/data/catalog";

const linePhotos: Record<string, string> = {
  "Apple Watch Ultra": "/watches/ultra-2.jpg",
  "Apple Watch Series": "/watches/series-10.jpg",
  "Apple Watch SE": "/watches/se-2.jpg",
  "fēnix": "/watches/fenix-6x.jpg",
  Forerunner: "/watches/forerunner-970.jpg",
  "Galaxy Watch": "/watches/galaxy-watch-6.jpg",
  "COROS PACE": "/watches/coros-pace-3.jpg",
  "Suunto Race": "/watches/suunto-t6c.jpg",
  "Amazfit GTR / GTS": "/watches/amazfit-bip.jpg",
  "Huawei Watch GT": "/watches/huawei-gt5.jpg",
  "Xiaomi Watch / Redmi Watch": "/brands/xiaomi.svg",
};
const lineImages = Object.fromEntries(lines.map((line) => [line.name, linePhotos[line.name] || `/brands/${line.brandId}.svg`]));

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
