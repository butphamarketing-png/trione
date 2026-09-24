export type RequestStatus = "da-duyet" | "chua-duyet" | "dang-cho-duyet";

export const statusLabel: Record<RequestStatus, string> = {
  "da-duyet": "Đã duyệt",
  "chua-duyet": "Chưa duyệt",
  "dang-cho-duyet": "Đang chờ duyệt",
};

export const staffStatusLabel = statusLabel;

export const statusClass: Record<RequestStatus, string> = {
  "da-duyet": "bg-green-50 text-green-700",
  "chua-duyet": "bg-rose-50 text-rose-700",
  "dang-cho-duyet": "bg-amber-50 text-amber-700",
};

export function normalizeRequestStatus(status: string): RequestStatus {
  if (status === "da-duyet" || status === "hoan-tat") return "da-duyet";
  if (status === "chua-duyet" || status === "tu-choi") return "chua-duyet";
  return "dang-cho-duyet";
}

export type TradeRequest = {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  brand: string;
  oldDevice: string;
  imeiOld: string;
  grade: string;
  tags: string[];
  photoCount: number;
  photos?: string[];
  newDevice: string;
  newSpecs: string;
  imeiNew?: string;
  newPrice: number;
  tradeIn: number;
  note: string;
  status: RequestStatus;
  source: string;
};

export const kpis = {
  total: 128,
  totalDelta: "+12% tháng này",
  waiting: 18,
  waitingHint: "6 yêu cầu mới",
  assessing: 9,
  assessingHint: "Cần xử lý hôm nay",
  doneMonth: 74,
  doneHint: "Tỷ lệ duyệt 80%",
};

export const requests: TradeRequest[] = [
  {
    id: "TRI-000128",
    username: "tranminhkhoa",
    name: "Trần Minh Khoa",
    createdAt: "17/09/2026 · 08:12",
    updatedAt: "08:15",
    address: "25 Nguyễn Trãi, P. Bến Thành, Quận 1, TP. Hồ Chí Minh",
    brand: "Apple",
    oldDevice: "Apple Watch Ultra 2 · 49 mm",
    imeiOld: "356789012345678",
    grade: "loại 1",
    tags: ["CHỨC NĂNG TỐT", "MÀN HÌNH XUẤT SẮC", "THÂN MÁY XUẤT SẮC"],
    photoCount: 7,
    newDevice: "Garmin fēnix 8 AMOLED",
    newSpecs: "47 mm · Sapphire · Đen",
    newPrice: 29_990_000,
    tradeIn: 8_500_000,
    note: "Khách hàng mang đầy đủ dây đeo và cáp sạc. Ưu tiên kiểm tra và phân hồi báo giá trong ngày.",
    status: "dang-cho-duyet",
    source: "Tạo bởi khách hàng TRIONE.VN",
  },
  {
    id: "TRI-000127",
    username: "nguyenngoccan",
    name: "Nguyễn Ngọc Hân",
    createdAt: "16/09/2026 · 07:43",
    updatedAt: "07:55",
    address: "Garmin Sala",
    brand: "Samsung",
    oldDevice: "Samsung Galaxy Watch6",
    imeiOld: "356111222333444",
    grade: "loại 2",
    tags: ["CHỨC NĂNG TỐT"],
    photoCount: 5,
    newDevice: "Venu 4",
    newSpecs: "45 mm · AMOLED",
    newPrice: 14_990_000,
    tradeIn: 3_200_000,
    note: "",
    status: "dang-cho-duyet",
    source: "CTV sala.hcm",
  },
  {
    id: "TRI-000126",
    username: "lequocbao",
    name: "Lê Quốc Bảo",
    createdAt: "16/09/2026 · 17:32",
    updatedAt: "17:46",
    address: "300/41/13A Nguyễn Thái Sơn",
    brand: "Garmin",
    oldDevice: "Garmin Forerunner 965",
    imeiOld: "8N1006390",
    grade: "loại 2",
    tags: ["ĐÃ GỬI BÁO GIÁ"],
    photoCount: 6,
    newDevice: "Forerunner 970",
    newSpecs: "47 mm · AMOLED",
    newPrice: 18_990_000,
    tradeIn: 7_100_000,
    note: "",
    status: "dang-cho-duyet",
    source: "Tạo bởi khách hàng TRIONE.VN",
  },
  {
    id: "TRI-000125",
    username: "phamthutrang",
    name: "Phạm Thu Trang",
    createdAt: "16/09/2026 · 15:08",
    updatedAt: "15:30",
    address: "163 Nguyễn Thị Minh Khai",
    brand: "Apple",
    oldDevice: "Apple Watch Series 9",
    imeiOld: "H1X9---Q7",
    grade: "loại 1",
    tags: ["HOÀN TẤT"],
    photoCount: 5,
    newDevice: "vivoactive 6",
    newSpecs: "42 mm · GPS",
    newPrice: 8_490_000,
    tradeIn: 4_600_000,
    note: "",
    status: "da-duyet",
    source: "Tạo bởi khách hàng TRIONE.VN",
  },
  {
    id: "TRI-000124",
    username: "dohainam",
    name: "Đỗ Hải Nam",
    createdAt: "16/09/2026 · 13:21",
    updatedAt: "14:05",
    address: "TGD_HCM_Q05 - 176 Nguyễn Tri Phương",
    brand: "Huawei",
    oldDevice: "Huawei Watch GT 5 Pro",
    imeiOld: "8SV047096",
    grade: "loại 5",
    tags: ["KHÔNG HOẠT ĐỘNG"],
    photoCount: 4,
    newDevice: "Instinct 3 AMOLED",
    newSpecs: "45 mm · Moss",
    newPrice: 12_990_000,
    tradeIn: 5_250_000,
    note: "Từ chối do lệch tình trạng thực tế.",
    status: "chua-duyet",
    source: "CTV",
  },
];

export const customers = [
  { username: "tranminhkhoa", name: "Trần Minh Khoa", phone: "0906 885 405", address: "25 Nguyễn Trãi, Q.1", orders: 1, type: "Khách" },
  { username: "nguyenngoccan", name: "Nguyễn Ngọc Hân", phone: "0902 111 222", address: "Garmin Sala", orders: 3, type: "Khách" },
  { username: "lequocbao", name: "Lê Quốc Bảo", phone: "0912 333 444", address: "Phường Hạnh Thông", orders: 1, type: "Khách" },
  { username: "phamthutrang", name: "Phạm Thu Trang", phone: "0988 222 111", address: "163 Nguyễn Thị Minh Khai", orders: 1, type: "Khách" },
  { username: "dohainam", name: "Đỗ Hải Nam", phone: "0903 777 888", address: "Q.5, TP.HCM", orders: 1, type: "Khách" },
  { username: "sala.hcm", name: "CTV Sala", phone: "0705 825 888", address: "Garmin Sala", orders: 80, type: "CTV" },
];

export const adminUsers = [
  { id: "u1", name: "Nguyễn Minh Anh", role: "Nhân viên", user: "nv.anh", status: "Hoạt động" },
  { id: "u2", name: "Admin TRIONE", role: "Quản trị", user: "admin", status: "Hoạt động" },
  { id: "u3", name: "CTV Sala", role: "Cộng tác viên", user: "sala.hcm", status: "Hoạt động" },
];
