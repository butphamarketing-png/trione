"use client";

import { AdminTable } from "@/components/admin-table";
import { statusLabel } from "@/data/staff";
import { useLiveRequests } from "@/lib/use-live-requests";
import { vnd } from "@/lib/pricing";

export default function OrdersAdminPage() {
  const rows = useLiveRequests().map((r, i) => [
    String(i + 1),
    r.id,
    r.username,
    r.createdAt,
    r.brand,
    r.oldDevice,
    r.imeiOld,
    r.grade,
    r.newDevice,
    vnd(Math.max(0, r.newPrice - r.tradeIn)),
    statusLabel[r.status],
  ]);
  return (
    <AdminTable
      title="Quản lý đơn hàng"
      titleLinks={false}
      redFrom={9}
      columns={["STT", "Mã", "Username", "Ngày đặt", "Hãng", "Máy thu cũ", "IMEI cũ", "Loại", "Máy đổi mới", "Tổng giá", "Trạng thái"]}
      rows={rows}
    />
  );
}
