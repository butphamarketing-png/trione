import { AdminTable } from "@/components/admin-table";
import { garminNew } from "@/data/catalog";
import { vndComma } from "@/lib/pricing";

const exchangePhotos: Record<string, string> = {
  "fēnix 8 AMOLED": "/watches/fenix-6x.jpg",
  "fēnix 8 Solar": "/watches/fenix-6x.jpg",
  "fēnix 7 Pro": "/watches/fenix-6x.jpg",
  "Forerunner 970": "/watches/forerunner-970.jpg",
  "Forerunner 570": "/watches/forerunner-265.jpg",
  "Forerunner 265": "/watches/forerunner-265.jpg",
  "Venu 4": "/watches/venu-3.jpg",
  "Venu 3": "/watches/venu-3.jpg",
  "Venu 3S": "/watches/venu-3.jpg",
  "Instinct 3 AMOLED": "/watches/instinct-2-solar.png",
  "Instinct 2X Solar": "/watches/instinct-2-solar.png",
  "Instinct 2S": "/watches/instinct-2s.jpg",
  "vivoactive 6": "/watches/vivoactive.jpg",
  "vivoactive 5": "/watches/vivoactive.jpg",
  "Lily 2 Active": "/watches/instinct-2s.jpg",
  "Lily 2 Classic": "/watches/instinct-2s.jpg",
  "epix Pro Gen 2": "/watches/fenix-6x.jpg",
  "Forerunner 965": "/watches/forerunner-965.jpg",
};

export default function NewProductsPage() {
  return (
    <AdminTable
      title="Sản phẩm đổi mới"
      redFrom={5}
      columns={["STT", "Hình", "Tiêu đề", "Danh mục cấp 1", "Series", "Giá niêm yết", "Hiển thị"]}
      defaultImages={exchangePhotos}
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
