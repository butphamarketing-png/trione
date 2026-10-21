"use client";

import { useState } from "react";
import { exchangeSheetRows, importExchangePriceRows, importSupportCsv, importSupportRows, supportSheetRows } from "@/lib/exchange-products";
import { importTradePriceRows, tradeSheetRows } from "@/lib/trade-products";

function cellText(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.round(value));
  return String(value).trim();
}

type SheetKind = "trade" | "exchange" | "support";

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

function ImportCard({
  title,
  blurb,
  downloadLabel,
  onDownload,
  onImport,
  acceptHint,
}: {
  title: string;
  blurb: string;
  downloadLabel: string;
  onDownload: () => void | Promise<void>;
  onImport: (input: { csv?: string; rows?: string[][] }) => { message: string; error: string };
  acceptHint: string;
}) {
  const [file, setFile] = useState("");
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
              setMessage("");
              setError("");
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
      <button
        type="button"
        onClick={() => {
          if (!csv && !rows) {
            setError("Chọn file Excel hoặc CSV trước khi nhập.");
            setMessage("");
            return;
          }
          const result = onImport({ csv, rows: rows ?? undefined });
          setMessage(result.message);
          setError(result.error);
        }}
        className="rounded bg-[#22a45a] px-4 py-2 text-sm font-semibold text-white"
      >
        + Import
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#e11d2e]">{error}</p> : null}
    </section>
  );
}

function formatResult(
  label: string,
  result: { updated: number; created?: number; missing: string[]; skipped: number },
) {
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
    XLSX.writeFile(book, "gia-san-pham-thu-cu.xlsx");
    return;
  }
  if (kind === "exchange") {
    const sheet = XLSX.utils.aoa_to_sheet(exchangeSheetRows());
    sheet["!cols"] = [{ wch: 18 }, { wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(book, sheet, "Doi moi");
    XLSX.writeFile(book, "gia-san-pham-doi-moi.xlsx");
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
        <h1 className="mb-2 text-lg font-semibold">Import / Export giá sản phẩm</h1>
        <p className="text-sm text-zinc-500">
          Xuất Excel theo từng loại, chỉnh hàng loạt rồi import lại. Khớp theo mã sản phẩm (SKU) hoặc tên. Dòng chưa có trong admin sẽ được tạo mới (cần mã hoặc tên + danh mục).
        </p>
      </div>

      <ImportCard
        title="Sản phẩm thu cũ — danh sách & giá loại 1–5"
        blurb="File gồm mã, tên, danh mục cấp 1/2 và giá loại 1 đến 5. Cập nhật sản phẩm đã có hoặc tạo mới nếu chưa khớp mã/tên."
        downloadLabel="Xuất sản phẩm thu cũ (.xlsx)"
        acceptHint="Nhận .xlsx, .xls hoặc CSV. Ô giá để trống khi cập nhật sẽ giữ nguyên; khi tạo mới để trống thì ghi 0."
        onDownload={() => downloadSheet("trade")}
        onImport={({ rows }) => formatResult("giá thu cũ", importTradePriceRows(rows ?? []))}
      />

      <ImportCard
        title="Sản phẩm đổi mới — danh sách, giá & trợ giá"
        blurb="File gồm mã, tên, danh mục, series, giá niêm yết và trợ giá. Cập nhật hoặc tạo mới. Giá tổng = giá gốc − giá đã thu cũ − trợ giá."
        downloadLabel="Xuất sản phẩm đổi mới (.xlsx)"
        acceptHint="Nhận .xlsx, .xls hoặc CSV. Ô trống khi cập nhật giữ nguyên giá cũ."
        onDownload={() => downloadSheet("exchange")}
        onImport={({ rows }) => formatResult("giá đổi mới", importExchangePriceRows(rows ?? []))}
      />

      <ImportCard
        title="Import trợ giá nhanh (sản phẩm mới)"
        blurb="Chỉ cập nhật cột trợ giá. Giữ để nhập nhanh khi không cần đổi giá niêm yết."
        downloadLabel="Xuất file trợ giá (.xlsx)"
        acceptHint="Nhận .xlsx, .xls hoặc CSV. Ô trợ giá để trống sẽ được bỏ qua."
        onDownload={() => downloadSheet("support")}
        onImport={({ csv, rows }) => {
          const result = csv ? importSupportCsv(csv) : importSupportRows(rows ?? []);
          return formatResult("trợ giá", result);
        }}
      />
    </div>
  );
}
