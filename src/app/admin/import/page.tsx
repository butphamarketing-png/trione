"use client";

import { useState } from "react";
import { importSupportCsv, supportCsv } from "@/lib/exchange-products";

export default function ImportPage() {
  const [file, setFile] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function download() {
    const blob = new Blob([`\uFEFF${supportCsv()}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tro-gia-san-pham-doi-moi.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
      <h1 className="mb-2 text-lg font-semibold">Import trợ giá sản phẩm đổi mới</h1>
      <p className="mb-6 text-sm text-zinc-500">
        File CSV gồm cột mã sản phẩm, tên sản phẩm, giá niêm yết, trợ giá. Chỉ cột trợ giá được ghi vào công thức giá thực.
      </p>
      <button type="button" onClick={download} className="mb-6 rounded border px-4 py-2 text-sm font-semibold">
        Xuất file trợ giá
      </button>
      <p className="mb-1 text-sm font-medium">Upload tập tin:</p>
      <p className="mb-3 text-xs text-zinc-500">Dùng file .csv. File Excel cần lưu lại dạng CSV trước khi nhập.</p>
      <div className="mb-6 flex items-center overflow-hidden rounded border">
        <span className="flex-1 truncate px-3 py-2 text-sm text-zinc-500">{file || "Chọn file"}</span>
        <label className="cursor-pointer bg-zinc-100 px-4 py-2 text-sm">
          Browse
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              setFile(picked?.name ?? "");
              setMessage("");
              setError("");
              setText("");
              if (!picked) return;
              if (!picked.name.toLowerCase().endsWith(".csv")) {
                setError("Chỉ nhận file CSV. Hãy lưu file Excel thành CSV rồi nhập lại.");
                return;
              }
              picked.text().then((value) => setText(value));
            }}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!text) {
            setError("Chọn file CSV trước khi nhập.");
            setMessage("");
            return;
          }
          const result = importSupportCsv(text);
          setError(result.missing.length ? `Không khớp: ${result.missing.join(", ")}` : "");
          setMessage(`Đã cập nhật trợ giá cho ${result.updated} sản phẩm.`);
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
