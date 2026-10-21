"use client";

import { useState } from "react";
import {
  exchangeSheetRows,
  importExchangePriceRows,
  importSupportCsv,
  importSupportRows,
  supportSheetRows,
  type ImportPreviewRow,
} from "@/lib/exchange-products";
import { level1SheetRows } from "@/lib/level1-categories";
import { level2SheetRows } from "@/lib/level2-categories";
import { importTradePriceRows, tradeSheetRows } from "@/lib/trade-products";

function cellText(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.round(value));
  return String(value).trim();
}

type SheetKind = "trade" | "exchange" | "support" | "level1" | "level2";

type ImportResult = {
  updated: number;
  created?: number;
  missing: string[];
  skipped: number;
  preview?: ImportPreviewRow[];
};

async function readGrid(file: File): Promise<{ csv?: string; rows?: string[][]; error?: string }> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    return { error: "Chỉ nhận file Excel (.xlsx, .xls) hoặc CSV." };
  }
  const XLSX = await import("xlsx");
  if (name.endsWith(".csv")) {
    const csv = await file.text();
    const book = XLSX.read(csv, { type: "string", FS: "," });
    const sheet = book.Sheets[book.SheetNames[0] ?? ""];
    if (!sheet) return { error: "File CSV không có sheet dữ liệu." };
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
    return { csv, rows: grid.map((row) => (Array.isArray(row) ? row : []).map(cellText)) };
  }
  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0] ?? ""];
  if (!sheet) return { error: "File Excel không có sheet dữ liệu." };
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  return { rows: grid.map((row) => (Array.isArray(row) ? row : []).map(cellText)) };
}

function actionLabel(action: ImportPreviewRow["action"]) {
  if (action === "create") return "Tạo mới";
  if (action === "update") return "Cập nhật";
  return "Bỏ qua";
}

function ImportCard({
  title,
  blurb,
  downloadLabel,
  onDownload,
  runImport,
  acceptHint,
}: {
  title: string;
  blurb: string;
  downloadLabel: string;
  onDownload: () => void | Promise<void>;
  runImport: (input: { csv?: string; rows?: string[][] }, dryRun: boolean) => ImportResult;
  acceptHint: string;
}) {
  const [file, setFile] = useState("");
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [counts, setCounts] = useState<{ updated: number; created: number; skipped: number } | null>(null);

  function clearResult() {
    setMessage("");
    setError("");
    setPreview(null);
    setCounts(null);
  }

  function apply(dryRun: boolean) {
    if (!csv && !rows) {
      setError("Chọn file Excel hoặc CSV trước khi nhập.");
      setMessage("");
      setPreview(null);
      setCounts(null);
      return;
    }
    const result = runImport({ csv, rows: rows ?? undefined }, dryRun);
    setCounts({
      updated: result.updated,
      created: result.created ?? 0,
      skipped: result.skipped,
    });
    setPreview(result.preview?.slice(0, 40) ?? null);
    if (dryRun) {
      setMessage(
        `Xem trước: tạo mới ${result.created ?? 0} · cập nhật ${result.updated} · bỏ qua ${result.skipped}. Bấm Xác nhận import để ghi.`,
      );
      setError(result.missing.length ? `Không khớp: ${result.missing.slice(0, 12).join(", ")}` : "");
      return;
    }
    const formatted = formatResult(title, result);
    setMessage(formatted.message);
    setError(formatted.error);
  }

  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-5">
      <h2 className="mb-1 text-base font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-zinc-500">{blurb}</p>
      <button type="button" onClick={() => void onDownload()} className="mb-4 rounded border px-4 py-2 text-sm font-semibold">
        {downloadLabel}
      </button>
      <p className="mb-1 text-sm font-medium">Upload tập tin:</p>
      <p className="mb-3 text-xs text-zinc-500">{acceptHint}</p>
      <div className="mb-4 flex items-center overflow-hidden rounded border">
        <span className="flex-1 truncate px-3 py-2 text-sm text-zinc-500">{file || "Chọn file"}</span>
        <label className="cursor-pointer bg-zinc-100 px-4 py-2 text-sm">
          Browse
          <input
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              setFile(picked?.name ?? "");
              clearResult();
              setCsv("");
              setRows(null);
              if (!picked) return;
              void readGrid(picked).then((result) => {
                if (result.error) {
                  setError(result.error);
                  return;
                }
                if (result.csv) setCsv(result.csv);
                if (result.rows) setRows(result.rows);
              });
            }}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => apply(true)} className="rounded border px-4 py-2 text-sm font-semibold">
          Xem trước
        </button>
        <button type="button" onClick={() => apply(false)} className="rounded bg-[#22a45a] px-4 py-2 text-sm font-semibold text-white">
          Xác nhận import
        </button>
      </div>
      {counts ? (
        <p className="mt-3 text-xs text-zinc-500">
          Tạo mới {counts.created} · cập nhật {counts.updated} · bỏ qua {counts.skipped}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#e11d2e]">{error}</p> : null}
      {preview?.length ? (
        <div className="mt-4 max-h-56 overflow-auto rounded border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-2 py-1.5">Hành động</th>
                <th className="px-2 py-1.5">Sản phẩm</th>
                <th className="px-2 py-1.5">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, index) => (
                <tr key={`${row.action}-${row.label}-${index}`} className="border-t border-zinc-100">
                  <td className="px-2 py-1.5 whitespace-nowrap font-medium">{actionLabel(row.action)}</td>
                  <td className="px-2 py-1.5">{row.label}</td>
                  <td className="px-2 py-1.5 text-zinc-500">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function formatResult(label: string, result: ImportResult) {
  const parts = [
    result.updated ? `cập nhật ${result.updated}` : "",
    result.created ? `tạo mới ${result.created}` : "",
  ].filter(Boolean);
  const summary = parts.length ? parts.join(" · ") : "không có dòng thay đổi";
  return {
    message: `Đã ${summary} (${label})${result.skipped ? ` · bỏ qua ${result.skipped} dòng trống` : ""}.`,
    error: result.missing.length
      ? `Không khớp: ${result.missing.slice(0, 12).join(", ")}${result.missing.length > 12 ? "…" : ""}`
      : "",
  };
}

async function downloadSheet(kind: SheetKind) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  if (kind === "trade") {
    const sheet = XLSX.utils.aoa_to_sheet(tradeSheetRows());
    sheet["!cols"] = [{ wch: 18 }, { wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(book, sheet, "Thu cu");
    XLSX.writeFile(book, "san-pham-thu-cu.xlsx");
    return;
  }
  if (kind === "exchange") {
    const sheet = XLSX.utils.aoa_to_sheet(exchangeSheetRows());
    sheet["!cols"] = [{ wch: 18 }, { wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(book, sheet, "Doi moi");
    XLSX.writeFile(book, "san-pham-doi-moi.xlsx");
    return;
  }
  if (kind === "level1") {
    const sheet = XLSX.utils.aoa_to_sheet(level1SheetRows());
    sheet["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 22 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(book, sheet, "Cap 1");
    XLSX.writeFile(book, "danh-muc-cap-1.xlsx");
    return;
  }
  if (kind === "level2") {
    const sheet = XLSX.utils.aoa_to_sheet(level2SheetRows());
    sheet["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(book, sheet, "Cap 2");
    XLSX.writeFile(book, "danh-muc-cap-2.xlsx");
    return;
  }
  const sheet = XLSX.utils.aoa_to_sheet(supportSheetRows());
  sheet["!cols"] = [{ wch: 22 }, { wch: 36 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(book, sheet, "Tro gia");
  XLSX.writeFile(book, "tro-gia-san-pham-moi.xlsx");
}

export default function ImportPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
        <h1 className="mb-2 text-lg font-semibold">Import / Export sản phẩm & danh mục</h1>
        <p className="text-sm text-zinc-500">
          Xuất Excel, chỉnh hàng loạt, bấm <strong>Xem trước</strong> rồi <strong>Xác nhận import</strong>. Khớp theo mã (SKU) hoặc tên; dòng chưa có sẽ tạo mới.
        </p>
      </div>

      <ImportCard
        title="Sản phẩm thu cũ — danh sách & giá loại 1–5"
        blurb="File gồm mã, tên, danh mục cấp 1/2 và giá loại 1 đến 5."
        downloadLabel="Xuất sản phẩm thu cũ (.xlsx)"
        acceptHint="Nhận .xlsx, .xls hoặc CSV."
        onDownload={() => downloadSheet("trade")}
        runImport={({ rows }, dryRun) => importTradePriceRows(rows ?? [], { dryRun })}
      />

      <ImportCard
        title="Sản phẩm đổi mới — danh sách, giá & trợ giá"
        blurb="File gồm mã, tên, danh mục, series, giá niêm yết và trợ giá."
        downloadLabel="Xuất sản phẩm đổi mới (.xlsx)"
        acceptHint="Nhận .xlsx, .xls hoặc CSV."
        onDownload={() => downloadSheet("exchange")}
        runImport={({ rows }, dryRun) => importExchangePriceRows(rows ?? [], { dryRun })}
      />

      <ImportCard
        title="Import trợ giá nhanh (sản phẩm mới)"
        blurb="Chỉ cập nhật cột trợ giá."
        downloadLabel="Xuất file trợ giá (.xlsx)"
        acceptHint="Ô trợ giá trống sẽ bỏ qua."
        onDownload={() => downloadSheet("support")}
        runImport={({ csv, rows }, dryRun) =>
          csv ? importSupportCsv(csv, { dryRun }) : importSupportRows(rows ?? [], { dryRun })
        }
      />

      <section className="rounded-sm border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold">Xuất danh mục</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Xuất danh mục cấp 1 (thương hiệu) và cấp 2 (dòng) để đối chiếu / gửi đối tác. Chỉnh sửa danh mục vẫn dùng trang admin tương ứng.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void downloadSheet("level1")} className="rounded border px-4 py-2 text-sm font-semibold">
            Xuất danh mục cấp 1 (.xlsx)
          </button>
          <button type="button" onClick={() => void downloadSheet("level2")} className="rounded border px-4 py-2 text-sm font-semibold">
            Xuất danh mục cấp 2 (.xlsx)
          </button>
        </div>
      </section>
    </div>
  );
}
