"use client";

import { AdminTable } from "@/components/admin-table";
import { statusLabel, type TradeRequest } from "@/data/staff";
import { useLiveRequests } from "@/lib/use-live-requests";
import { vnd } from "@/lib/pricing";

const optionRules: { label: string; test: RegExp }[] = [
  { label: "GPS", test: /\bgps\b/i },
  { label: "Cellular / LTE", test: /cellular|\blte\b/i },
  { label: "Sapphire", test: /sapphire/i },
  { label: "AMOLED", test: /amoled/i },
  { label: "Titanium", test: /titanium/i },
  { label: "Solar", test: /solar/i },
  { label: "MIP", test: /\bmip\b/i },
];

function gradeLabel(grade: string) {
  const level = grade.match(/[1-5]/)?.[0];
  return level ? `Loại ${level}` : grade || "—";
}

function suggestedOption(request: TradeRequest) {
  const specs = `${request.newDevice} ${request.newSpecs}`;
  const matched = optionRules.filter((rule) => rule.test.test(specs)).map((rule) => rule.label);
  if (matched.length) return matched.join(", ");
  return specs || "—";
}

export default function OrdersAdminPage() {
  const rows = useLiveRequests().map((request, index) => [
    String(index + 1),
    request.id,
    request.name,
    request.address,
    vnd(request.tradeIn),
    request.createdAt,
    request.brand,
    request.oldDevice,
    request.imeiOld,
    gradeLabel(request.grade),
    request.newDevice ? "Thu cũ đổi mới" : "Thu cũ",
    request.newDevice || "—",
    request.imeiNew || "Chưa nhập",
    suggestedOption(request),
    statusLabel[request.status],
  ]);
  return (
    <AdminTable
      title="Quản lý đơn hàng"
      titleLinks={false}
      live
      wide
      redIndexes={[4]}
      columns={[
        "STT",
        "Mã đơn hàng",
        "Tên nhân viên",
        "Địa chỉ",
        "Giá",
        "Ngày đặt",
        "Hãng",
        "Tên máy",
        "IMEI",
        "Tình trạng máy",
        "Nhu cầu của khách",
        "Tên máy đổi mới",
        "IMEI máy đổi mới",
        "Option được đề xuất",
        "Tình trạng đơn hàng",
      ]}
      rows={rows}
    />
  );
}
