export type Grade = 1 | 2 | 3 | 4 | 5;

export type Brand = {
  id: string;
  name: string;
  line: string;
  mark: string;
  markClass: string;
};

export type ProductLine = {
  id: string;
  brandId: string;
  name: string;
  blurb: string;
  thumb: string;
  image: string;
};

export type TradeInModel = {
  id: string;
  lineId: string;
  name: string;
  specs: string;
  blurb: string;
  prices: Record<Grade, number>;
};

export type NewGarmin = {
  id: string;
  series: string;
  name: string;
  specs: string;
  listPrice: number;
  face: string;
  strap: string;
  time: string;
};

export const brands: Brand[] = [
  { id: "apple", name: "Apple", line: "Apple Watch", mark: "", markClass: "bg-black text-white" },
  { id: "samsung", name: "Samsung", line: "Galaxy Watch", mark: "SAMSUNG", markClass: "bg-blue-50 text-blue-800 text-[9px] font-bold" },
  { id: "garmin", name: "Garmin", line: "Smartwatch GPS", mark: "GARMIN", markClass: "bg-sky-50 text-sky-800 text-[9px] font-bold" },
  { id: "coros", name: "COROS", line: "Đồng hồ thể thao", mark: "COROS", markClass: "text-red-500 text-[11px] font-bold" },
  { id: "suunto", name: "Suunto", line: "Đồng hồ ngoài trời", mark: "SUUNTO", markClass: "text-[11px] font-extrabold tracking-widest" },
  { id: "amazfit", name: "Amazfit", line: "Smartwatch", mark: "amazfit", markClass: "text-[12px] font-semibold" },
  { id: "huawei", name: "Huawei", line: "Huawei Watch", mark: "❁", markClass: "bg-rose-50 text-red-500 text-2xl" },
  { id: "xiaomi", name: "Xiaomi", line: "Mi Watch / Redmi Watch", mark: "mi", markClass: "bg-orange-100 text-orange-500 text-xl font-bold rounded-lg" },
];

export const lines: ProductLine[] = [
  {
    id: "ultra",
    brandId: "apple",
    name: "Apple Watch Ultra",
    blurb: "Dòng cao cấp, thiết kế titanium bền bỉ dành cho thể thao và hoạt động ngoài trời.",
    thumb: "ultra",
    image: "/watches/ultra-2.jpg",
  },
  {
    id: "series",
    brandId: "apple",
    name: "Apple Watch Series",
    blurb: "Dòng tiêu chuẩn với các tính năng sức khỏe, luyện tập và kết nối hằng ngày.",
    thumb: "series",
    image: "/watches/series-10.jpg",
  },
  {
    id: "se",
    brandId: "apple",
    name: "Apple Watch SE",
    blurb: "Dòng thiết yếu, dễ sử dụng và phù hợp với nhu cầu theo dõi sức khỏe cơ bản.",
    thumb: "se",
    image: "/watches/se-2.jpg",
  },
  {
    id: "fenix-old",
    brandId: "garmin",
    name: "fēnix",
    blurb: "Đồng hồ đa thể thao ngoài trời, GPS và pin lâu.",
    thumb: "garmin",
    image: "/watches/fenix-6x.jpg",
  },
  {
    id: "fr-old",
    brandId: "garmin",
    name: "Forerunner",
    blurb: "Đồng hồ chạy bộ GPS, theo dõi luyện tập chuyên sâu.",
    thumb: "garmin",
    image: "/watches/forerunner-970.jpg",
  },
  {
    id: "gw",
    brandId: "samsung",
    name: "Galaxy Watch",
    blurb: "Đồng hồ thông minh Android, sức khỏe và Wear OS.",
    thumb: "android",
    image: "/watches/galaxy-watch-6.jpg",
  },
  {
    id: "coros-pace",
    brandId: "coros",
    name: "COROS PACE",
    blurb: "Đồng hồ chạy bộ nhẹ, pin lâu, GPS kép.",
    thumb: "sport",
    image: "/watches/coros-pace-3.jpg",
  },
  {
    id: "suunto-race",
    brandId: "suunto",
    name: "Suunto Race",
    blurb: "Đồng hồ đa thể thao ngoài trời, bản đồ và pin bền.",
    thumb: "sport",
    image: "/watches/suunto-9.jpg",
  },
  {
    id: "amazfit-gtr",
    brandId: "amazfit",
    name: "Amazfit GTR / GTS",
    blurb: "Smartwatch pin lâu, theo dõi sức khỏe hàng ngày.",
    thumb: "android",
    image: "/watches/amazfit-band.jpg",
  },
  {
    id: "huawei-gt",
    brandId: "huawei",
    name: "Huawei Watch GT",
    blurb: "Đồng hồ thể thao pin lâu ngày, GPS và theo dõi sức khỏe.",
    thumb: "sport",
    image: "/watches/huawei-gt5.jpg",
  },
  {
    id: "mi-watch",
    brandId: "xiaomi",
    name: "Xiaomi Watch / Redmi Watch",
    blurb: "Smartwatch giá tốt, theo dõi vận động cơ bản.",
    thumb: "android",
    image: "/watches/xiaomi-watch.jpg",
  },
];

export const models: TradeInModel[] = [
  {
    id: "ultra2",
    lineId: "ultra",
    name: "Apple Watch Ultra 2",
    specs: "49 mm · GPS + Cellular · Vỏ titanium",
    blurb: "Thế hệ hai với hiệu năng nâng cấp và thao tác hai lần.",
    prices: { 1: 8_500_000, 2: 7_200_000, 3: 6_000_000, 4: 4_200_000, 5: 1_800_000 },
  },
  {
    id: "ultra1",
    lineId: "ultra",
    name: "Apple Watch Ultra",
    specs: "49 mm · GPS + Cellular · Vỏ titanium",
    blurb: "Thế hệ đầu tiên, thiết kế bền bỉ cho khám phá và thể thao ngoài trời.",
    prices: { 1: 6_800_000, 2: 5_600_000, 3: 4_500_000, 4: 3_200_000, 5: 1_200_000 },
  },
  {
    id: "s10",
    lineId: "series",
    name: "Apple Watch Series 10",
    specs: "42/46 mm · GPS / Cellular",
    blurb: "Màn hình rộng hơn, mỏng hơn, cảm biến sức khỏe thế hệ mới.",
    prices: { 1: 5_200_000, 2: 4_400_000, 3: 3_500_000, 4: 2_400_000, 5: 900_000 },
  },
  {
    id: "s9",
    lineId: "series",
    name: "Apple Watch Series 9",
    specs: "41/45 mm · GPS / Cellular",
    blurb: "S9 SiP, Double Tap, màn hình sáng hơn.",
    prices: { 1: 4_200_000, 2: 3_500_000, 3: 2_800_000, 4: 1_900_000, 5: 700_000 },
  },
  {
    id: "s8",
    lineId: "series",
    name: "Apple Watch Series 8",
    specs: "41/45 mm · GPS / Cellular",
    blurb: "Cảm biến nhiệt độ, Crash Detection.",
    prices: { 1: 3_400_000, 2: 2_800_000, 3: 2_200_000, 4: 1_500_000, 5: 550_000 },
  },
  {
    id: "s7",
    lineId: "series",
    name: "Apple Watch Series 7",
    specs: "41/45 mm · GPS / Cellular",
    blurb: "Màn hình lớn hơn Series 6, sạc nhanh.",
    prices: { 1: 2_600_000, 2: 2_100_000, 3: 1_600_000, 4: 1_100_000, 5: 400_000 },
  },
  {
    id: "se2",
    lineId: "se",
    name: "Apple Watch SE (2023)",
    specs: "40/44 mm · GPS / Cellular",
    blurb: "Crash Detection, chip S8, giá dễ tiếp cận.",
    prices: { 1: 2_800_000, 2: 2_300_000, 3: 1_800_000, 4: 1_200_000, 5: 500_000 },
  },
  {
    id: "se1",
    lineId: "se",
    name: "Apple Watch SE (2020)",
    specs: "40/44 mm · GPS / Cellular",
    blurb: "Thế hệ đầu, theo dõi sức khỏe cơ bản.",
    prices: { 1: 1_600_000, 2: 1_300_000, 3: 1_000_000, 4: 650_000, 5: 250_000 },
  },
  {
    id: "fenix7",
    lineId: "fenix-old",
    name: "Garmin fēnix 7 Sapphire",
    specs: "47 mm · Sapphire · GPS",
    blurb: "Đồng hồ ngoài trời cao cấp thế hệ trước.",
    prices: { 1: 7_800_000, 2: 6_500_000, 3: 5_200_000, 4: 3_600_000, 5: 1_400_000 },
  },
  {
    id: "fr165",
    lineId: "fr-old",
    name: "Garmin Forerunner 165",
    specs: "43 mm · AMOLED · GPS",
    blurb: "Đồng hồ chạy bộ AMOLED với giá dễ tiếp cận.",
    prices: { 1: 2_200_000, 2: 1_800_000, 3: 1_400_000, 4: 900_000, 5: 400_000 },
  },
  {
    id: "fr970-old",
    lineId: "fr-old",
    name: "Garmin Forerunner 970",
    specs: "47 mm · AMOLED",
    blurb: "Forerunner cao cấp, bản đồ và luyện tập nâng cao.",
    prices: { 1: 7_100_000, 2: 6_200_000, 3: 5_000_000, 4: 3_400_000, 5: 1_500_000 },
  },
  {
    id: "gw6",
    lineId: "gw",
    name: "Samsung Galaxy Watch6",
    specs: "40/44 mm · LTE",
    blurb: "Wear OS, vòng Biometric, theo dõi ngủ nâng cao.",
    prices: { 1: 3_800_000, 2: 3_200_000, 3: 2_500_000, 4: 1_600_000, 5: 600_000 },
  },
  {
    id: "pace3",
    lineId: "coros-pace",
    name: "COROS PACE 3",
    specs: "42 mm · GPS kép",
    blurb: "Đồng hồ chạy bộ siêu nhẹ.",
    prices: { 1: 3_200_000, 2: 2_600_000, 3: 2_000_000, 4: 1_200_000, 5: 500_000 },
  },
  {
    id: "race2",
    lineId: "suunto-race",
    name: "Suunto Race 2",
    specs: "49 mm · AMOLED",
    blurb: "Đa thể thao, bản đồ và pin bền.",
    prices: { 1: 6_500_000, 2: 5_400_000, 3: 4_200_000, 4: 2_800_000, 5: 1_000_000 },
  },
  {
    id: "gtr4",
    lineId: "amazfit-gtr",
    name: "Amazfit GTR 4",
    specs: "46 mm · GPS",
    blurb: "Pin lâu, theo dõi sức khỏe.",
    prices: { 1: 2_400_000, 2: 1_900_000, 3: 1_400_000, 4: 800_000, 5: 300_000 },
  },
  {
    id: "gt5",
    lineId: "huawei-gt",
    name: "Huawei Watch GT 5 Pro",
    specs: "46 mm · Titanium",
    blurb: "Pin nhiều ngày, GPS và sức khỏe.",
    prices: { 1: 5_250_000, 2: 4_400_000, 3: 3_500_000, 4: 2_200_000, 5: 800_000 },
  },
  {
    id: "redmi",
    lineId: "mi-watch",
    name: "Redmi Watch 5",
    specs: "46 mm · AMOLED",
    blurb: "Smartwatch phổ thông.",
    prices: { 1: 1_200_000, 2: 900_000, 3: 650_000, 4: 400_000, 5: 150_000 },
  },
];

export const issues = [
  { id: "hr", name: "Không có cảm biến nhịp tim", hint: "Không nhận hoặc không đo được nhịp tim.", icon: "♡" },
  { id: "gps", name: "Không có cảm biến GPS", hint: "Không bắt được GPS hoặc định vị không hoạt động.", icon: "◷" },
  { id: "spo2", name: "Không có cảm biến đo oxy", hint: "Không đo được SpO2 hoặc tính năng không phản hồi.", icon: "O₂" },
  { id: "other", name: "Khác", hint: "Vấn đề khác không nằm trong danh sách trên.", icon: "+" },
];

export const screenOptions = [
  { id: "excellent", name: "Xuất sắc", hint: "Mặt kính sạch, không có vết xước, sứt mẻ, nứt hoặc điểm ảnh lỗi nhìn thấy được.", tag: "NHƯ MỚI", tone: "good" as const },
  { id: "light", name: "Đã qua sử dụng nhẹ", hint: "Có một vài vết xước nhẹ, chỉ nhìn thấy khi quan sát gần hoặc nghiêng dưới ánh sáng.", tag: "Không có vết nứt, sứt mẻ hoặc lỗi hiển thị.", tone: "warn" as const },
  { id: "broken", name: "Hư hỏng", hint: "Có vết xước sâu, sứt mẻ, nứt mặt kính, sọc màn hình hoặc điểm ảnh bị lỗi.", tag: "Tình trạng này có thể ảnh hưởng đáng kể đến giá thu cũ.", tone: "bad" as const },
];

export const bodyOptions = [
  { id: "excellent", name: "Xuất sắc", hint: "Thân máy sạch, không móp; nút bấm chắc chắn, phản hồi rõ và nhạy.", tag: "NHƯ MỚI", tone: "good" as const },
  { id: "light", name: "Hao mòn thông thường", hint: "Có vết trầy hoặc dấu sử dụng nhỏ trên viền và mặt lưng.", tag: "Nút bấm và cảm biến vẫn hoạt động bình thường.", tone: "warn" as const },
  { id: "heavy", name: "Hao mòn nặng", hint: "Bị móp, trầy sâu, kẹt nút hoặc hỏng khu vực cảm biến.", tag: "Tình trạng này có thể ảnh hưởng đáng kể đến giá thu cũ.", tone: "bad" as const },
];

export const batteryOptions = [
  { id: "good", name: "Pin còn tốt", hint: "Dùng được gần như cả ngày, sạc bình thường." },
  { id: "fair", name: "Pin chai nhẹ", hint: "Hết pin nhanh hơn lúc mới, vẫn dùng được." },
  { id: "poor", name: "Pin kém / phồng", hint: "Phải sạc nhiều lần trong ngày hoặc pin bất thường." },
];

export const strapOptions = [
  { id: "good", name: "Dây đeo tốt", hint: "Dây còn chắc, khóa hoạt động, ít mòn." },
  { id: "fair", name: "Dây mòn vừa", hint: "Có trầy, phai màu, vẫn dùng được." },
  { id: "poor", name: "Dây hỏng / mất", hint: "Nứt, đứt, mất khóa hoặc không còn dây." },
];

export const photoSlots = [
  { id: "front", label: "Mặt trước", required: false, hint: "+ Thêm ảnh", icon: "🖼" },
  { id: "back", label: "Mặt sau", required: false, hint: "+ Thêm ảnh", icon: "🖼" },
  { id: "left", label: "Mặt ngang bên trái", required: false, hint: "+ Thêm ảnh", icon: "🖼" },
  { id: "right", label: "Mặt ngang bên phải", required: false, hint: "+ Thêm ảnh", icon: "🖼" },
  { id: "serial", label: "Số serial", required: false, hint: "+ Chụp rõ dây số", icon: "☰" },
  { id: "defect", label: "Lỗi ngoại quan", required: false, hint: "+ Thêm ảnh cận cảnh", icon: "◌" },
  { id: "accessories", label: "Phụ kiện", required: false, hint: "+ Dây đeo, sạc, hộp…", icon: "▢" },
];

export const garminNew: NewGarmin[] = [
  { id: "fenix8", series: "FĒNIX", name: "fēnix 8 AMOLED", specs: "47 mm · Sapphire · Đen", listPrice: 29_990_000, face: "#1c1c1c", strap: "#2a2a2a", time: "10:09" },
  { id: "fenix8s", series: "FĒNIX", name: "fēnix 8 Solar", specs: "51 mm · Sapphire · Carbon", listPrice: 32_990_000, face: "#111", strap: "#333", time: "10:09" },
  { id: "fenix7pro", series: "FĒNIX", name: "fēnix 7 Pro", specs: "47 mm · Solar · Đen", listPrice: 24_990_000, face: "#1a1a1a", strap: "#c45a28", time: "09:41" },
  { id: "fr970", series: "FORERUNNER", name: "Forerunner 970", specs: "47 mm · AMOLED · Xanh", listPrice: 18_990_000, face: "#163a2a", strap: "#1a3d2c", time: "06:30" },
  { id: "fr570", series: "FORERUNNER", name: "Forerunner 570", specs: "42 mm · AMOLED · Trắng", listPrice: 12_990_000, face: "#e8e4dc", strap: "#d0cbc0", time: "08:12" },
  { id: "fr265", series: "FORERUNNER", name: "Forerunner 265", specs: "46 mm · AMOLED · Đen", listPrice: 9_990_000, face: "#111", strap: "#222", time: "07:05" },
  { id: "venu4", series: "VENU", name: "Venu 4", specs: "45 mm · AMOLED · Be", listPrice: 14_990_000, face: "#c4b49a", strap: "#d4c4a8", time: "09:41" },
  { id: "venu3", series: "VENU", name: "Venu 3", specs: "45 mm · AMOLED · Slate", listPrice: 11_990_000, face: "#2a2e33", strap: "#4a4e54", time: "10:09" },
  { id: "venu3s", series: "VENU", name: "Venu 3S", specs: "41 mm · AMOLED · Soft Gold", listPrice: 10_990_000, face: "#c9b896", strap: "#e8dcc8", time: "11:20" },
  { id: "instinct3", series: "INSTINCT", name: "Instinct 3 AMOLED", specs: "45 mm · AMOLED · Moss", listPrice: 12_990_000, face: "#3d4a2e", strap: "#2f3a24", time: "10:09" },
  { id: "instinct2x", series: "INSTINCT", name: "Instinct 2X Solar", specs: "50 mm · MIP · Graphite", listPrice: 9_490_000, face: "#2b2b2b", strap: "#444", time: "12:00" },
  { id: "instinct2s", series: "INSTINCT", name: "Instinct 2S", specs: "40 mm · MIP · Mist", listPrice: 7_490_000, face: "#4a5560", strap: "#8899aa", time: "06:45" },
  { id: "vivo6", series: "VIVOACTIVE", name: "vivoactive 6", specs: "42 mm · AMOLED · Slate", listPrice: 8_490_000, face: "#2a2e33", strap: "#4a4e54", time: "08:15" },
  { id: "vivo5", series: "VIVOACTIVE", name: "vivoactive 5", specs: "42 mm · AMOLED · Ivory", listPrice: 6_990_000, face: "#efe6d6", strap: "#d9cbb8", time: "09:00" },
  { id: "lily2", series: "LILY", name: "Lily 2 Active", specs: "38 mm · AMOLED · Hồng", listPrice: 7_990_000, face: "#e7c1c8", strap: "#d9a7b0", time: "10:09" },
  { id: "lily2c", series: "LILY", name: "Lily 2 Classic", specs: "35 mm · AMOLED · Cream Gold", listPrice: 6_490_000, face: "#f3e6c8", strap: "#c9a227", time: "10:09" },
  { id: "epixpro", series: "FĒNIX", name: "epix Pro Gen 2", specs: "47 mm · AMOLED · Titanium", listPrice: 26_990_000, face: "#101418", strap: "#c45a28", time: "10:09" },
  { id: "fr965", series: "FORERUNNER", name: "Forerunner 965", specs: "47 mm · AMOLED · Titanium", listPrice: 15_990_000, face: "#163a2a", strap: "#888", time: "05:55" },
];

export const seriesFilters = ["TẤT CẢ", "FĒNIX", "FORERUNNER", "VENU", "INSTINCT", "VIVOACTIVE", "LILY"];
