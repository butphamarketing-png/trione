"use client";

import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState("");
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState("");

  return (
    <div className="max-w-4xl rounded-sm border-t-4 border-[#2f6fed] bg-white p-6">
      <h1 className="mb-6 text-lg font-semibold">Import danh sách dữ liệu</h1>
      <p className="mb-1 text-sm font-medium">Upload tập tin:</p>
      <p className="mb-3 text-xs text-zinc-500">Loại : .xls, .xlsx, .csv (Ms.Excel 2003 - 2007)</p>
      <div className="mb-6 flex items-center overflow-hidden rounded border">
        <span className="flex-1 truncate px-3 py-2 text-sm text-zinc-500">{file || "Chọn file"}</span>
        <label className="cursor-pointer bg-zinc-100 px-4 py-2 text-sm">
          Browse
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f?.name ?? "");
              setDone(false);
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => {
                const text = String(reader.result ?? "");
                const lines = text.split(/\r?\n/).filter((l) => l.trim());
                if (f.name.toLowerCase().endsWith(".csv") && lines.length > 0) {
                  const cols = lines[0].split(/[,;]/).length;
                  setPreview(
                    `${Math.max(0, lines.length - 1)} dòng dữ liệu · ${cols} cột (giá loại 1–5 nếu có).`
                  );
                } else {
                  setPreview(`Đã nhận ${f.name} · ${Math.round(f.size / 1024)} KB (demo không ghi database).`);
                }
              };
              if (f.name.toLowerCase().endsWith(".csv")) reader.readAsText(f);
              else setPreview(`Đã nhận ${f.name} · ${Math.round(f.size / 1024)} KB — dùng file .csv để xem số dòng giá.`);
            }}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => setDone(true)}
        className="rounded bg-[#22a45a] px-4 py-2 text-sm font-semibold text-white"
      >
        + Import
      </button>
      {done && (
        <p className="mt-4 text-sm text-emerald-700">
          Demo: {preview || `đã nhận file ${file || "mẫu"} — không ghi database.`}
        </p>
      )}
    </div>
  );
}
