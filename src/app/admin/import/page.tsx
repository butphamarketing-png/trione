"use client";

import { useState } from "react";
import { importSupportCsv, importSupportRows, supportSheetRows } from "@/lib/exchange-products";

function cellText(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.round(value));
  return String(value).trim();
}

export default function ImportPage() {
  const [file, setFile] = useState("");
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function download() {
    const XLSX = await import("xlsx");
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(supportSheetRows());
    sheet["!cols"] = [{ wch: 22 }, { wch: 36 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(book, sheet, "Tro gia");
    XLSX.writeFile(book, "tro-gia-san-pham-moi.xlsx");
  }

  return (
    <div className="max-w-4xl rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
      <h1 className="mb-2 text-lg font-semibold">Import trợ giá sản phẩm mới</h1>
      <p className="mb-6 text-sm text-zinc-500">
        File Excel gồm cột mã sản phẩm, tên sản phẩm, giá niêm yết và trợ giá. Chỉ cột trợ giá của sản phẩm mới được ghi vào công thức giá tổng = giá gốc − giá đã thu cũ − trợ giá. Sản phẩm thu cũ không bị đổi.
      </p>
      <button type="button" onClick={() => void download()} className="mb-6 rounded border px-4 py-2 text-sm font-semibold">
        Xuất file trợ giá (.xlsx)
      </button>
      <p className="mb-1 text-sm font-medium">Upload tập tin:</p>
      <p className="mb-3 text-xs text-zinc-500">Nhận file Excel .xlsx, .xls hoặc CSV. Ô trợ giá để trống sẽ được bỏ qua.</p>
      <div className="mb-6 flex items-center overflow-hidden rounded border">
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
              const name = picked.name.toLowerCase();
              if (name.endsWith(".csv")) {
                void picked.text().then((value) => setCsv(value));
                return;
              }
              if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
                setError("Chỉ nhận file Excel (.xlsx, .xls) hoặc CSV.");
                return;
              }
              void picked.arrayBuffer().then(async (buffer) => {
                const XLSX = await import("xlsx");
                const book = XLSX.read(buffer, { type: "array" });
                const sheet = book.Sheets[book.SheetNames[0] ?? ""];
                if (!sheet) {
                  setError("File Excel không có sheet dữ liệu.");
                  return;
                }
                const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
                setRows(grid.map((row) => (Array.isArray(row) ? row : []).map(cellText)));
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
          const result = csv ? importSupportCsv(csv) : importSupportRows(rows ?? []);
          setError(result.missing.length ? `Không khớp: ${result.missing.join(", ")}` : "");
          setMessage(`Đã cập nhật trợ giá cho ${result.updated} sản phẩm mới.`);
        }}
        className="rounded bg-[#22a45a] px-4 py-2 text-sm font-semibold text-white"
      >
        + Import
      </button>
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#e11d2e]">{error}</p> : null}
    </div>
  );
}
