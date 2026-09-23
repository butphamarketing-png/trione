import { AdminTable } from "@/components/admin-table";
import { brands, lines, models } from "@/data/catalog";

const level1 = [
  ...brands.map((brand) => ({
    code: brand.id,
    name: brand.name,
    image: `/brands/${brand.id}.svg`,
    count: models.filter((model) => lines.find((line) => line.id === model.lineId)?.brandId === brand.id).length,
  })),
  { code: "other", name: "Thương hiệu khác", image: "/brands/other.svg", count: 0 },
];

const categoryImages = Object.fromEntries(level1.map((item) => [item.name, item.image]));
const level1Codes = level1.map((item) => item.code);

export default function CategoryPage() {
  return (
    <AdminTable
      title="Danh mục cấp 1"
      columns={["STT", "Hình", "Tiêu đề", "Nổi bật", "Số sản phẩm", "Hiển thị"]}
      rows={level1.map((item, index) => [String(index + 1), "", item.name, "", String(item.count), "✓"])}
      defaultImages={categoryImages}
      codes={level1Codes}
      presetVersion="categories-v2"
    />
  );
}
