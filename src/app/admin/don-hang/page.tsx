"use client";

import { AdminTable } from "@/components/admin-table";
import { statusLabel, type RequestStatus, type TradeRequest } from "@/data/staff";
import { patchRequest } from "@/lib/demo-requests";
import type { AdminRecord } from "@/lib/admin-records";
import { useEffect, useState } from "react";
import { useLiveRequests } from "@/lib/use-live-requests";
import { exchangeDue, vnd } from "@/lib/pricing";

const optionSeed = ["GPS", "Cellular / LTE", "Sapphire", "AMOLED", "Titanium", "Solar", "MIP", "Pin", "Dây đeo"];

function readOptionTitles() {
  if (typeof window === "undefined") return optionSeed;
  try {
    const raw = sessionStorage.getItem("trione-admin:Quản lý Option");
    if (!raw) return optionSeed;
    const rows = JSON.parse(raw) as { cells?: string[] }[];
    if (!Array.isArray(rows)) return optionSeed;
    const titles = rows
      .filter((row) => (row.cells ?? []).at(-1) === "✓")
      .map((row) => (row.cells?.[1] ?? "").trim())
      .filter(Boolean);
    return titles.length ? titles : optionSeed;
  } catch {
    return optionSeed;
  }
}

function gradeLabel(grade: string) {
  const level = grade.match(/[1-5]/)?.[0];
  return level ? `Loại ${level}` : grade || "—";
}

function suggestedOption(request: TradeRequest, titles: string[]) {
  const specs = `${request.newDevice} ${request.newSpecs}`.toLowerCase();
  const matched = titles.filter((title) =>
    title
      .split("/")
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length >= 2)
      .some((part) => specs.includes(part))
  );
  if (matched.length) return matched.join(", ");
  return `${request.newDevice} ${request.newSpecs}`.trim() || "—";
}

function statusFromLabel(label: string): RequestStatus {
  if (label.includes("Đã duyệt")) return "da-duyet";
  if (label.includes("Chưa duyệt")) return "chua-duyet";
  return "dang-cho-duyet";
}

export default function OrdersAdminPage() {
  const live = useLiveRequests();
  const [options, setOptions] = useState(optionSeed);
  useEffect(() => {
    const sync = () => setOptions(readOptionTitles());
    sync();
    window.addEventListener("trione-catalog", sync);
    return () => window.removeEventListener("trione-catalog", sync);
  }, []);
  function sync(records: AdminRecord[]) {
    for (const record of records) {
      const id = record.cells[1]?.trim();
      if (!id || !live.some((item) => item.id === id)) continue;
      const imeiNew = record.cells[12]?.trim();
      patchRequest(id, {
        name: record.cells[2]?.trim() || "",
        address: record.cells[3]?.trim() || "",
        imeiOld: record.cells[8]?.trim() || "",
        imeiNew: !imeiNew || imeiNew === "Chưa nhập" ? "" : imeiNew,
        status: statusFromLabel(record.cells[14] ?? ""),
      });
    }
  }
  const rows = live.map((request, index) => [
    String(index + 1),
    request.id,
    request.name,
    request.address,
    vnd(exchangeDue(request.newPrice, request.tradeIn, request.supportPrice ?? 0)),
    request.createdAt,
    request.brand,
    request.oldDevice,
    request.imeiOld,
    gradeLabel(request.grade),
    request.newDevice ? "Thu cũ đổi mới" : "Thu cũ",
    request.newDevice || "—",
    request.imeiNew || "Chưa nhập",
    suggestedOption(request, options),
    statusLabel[request.status],
    vnd(request.supportPrice ?? 0),
    vnd(request.tradeIn),
  ]);
  return (
    <AdminTable
      title="Quản lý đơn hàng"
      titleLinks={false}
      live
      wide
      onCommit={sync}
      redIndexes={[4]}
      columns={[
        "STT",
        "Mã đơn hàng",
        "Người gửi",
        "Địa chỉ",
        "Giá thực",
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
        "Trợ giá",
        "Giá thu cũ",
      ]}
      rows={rows}
    />
  );
}
