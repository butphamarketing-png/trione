"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const all = [header, ...rows];
  const csv = all
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminTable({
  title,
  columns,
  rows,
  filters,
  redFrom,
  titleLinks = true,
}: {
  title: string;
  columns: string[];
  rows: string[][];
  filters?: ReactNode;
  redFrom?: number;
  titleLinks?: boolean;
}) {
  const [q, setQ] = useState("");
  useEffect(() => {
    setQ("");
  }, [rows.length]);
  const visible = useMemo(
    () => rows.filter((r) => !q.trim() || r.join(" ").toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded bg-[#2f6fed] px-3 py-2 text-sm text-white">
          + Thêm mới
        </button>
        <button type="button" className="rounded bg-[#e11d2e] px-3 py-2 text-sm text-white">
          🗑 Xóa tất cả
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(`${title}.csv`, columns, visible)}
          className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
        >
          ↥ Export Excel
        </button>
        <div className="flex overflow-hidden rounded border bg-white">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="px-3 py-2 text-sm outline-none"
            placeholder="Tìm kiếm"
          />
          <span className="grid place-items-center bg-zinc-50 px-3 text-zinc-400">⌕</span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-sm border-t-4 border-[#2f6fed] bg-white">
        {filters && <div className="flex flex-wrap gap-2 px-4 pt-4">{filters}</div>}
        <h2 className="p-4 font-semibold">{title}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-500">
            <tr>
              <th className="w-8 px-4 py-2">
                <input type="checkbox" />
              </th>
              {columns.map((c) => (
                <th key={c} className="px-4 py-2">
                  {c}
                </th>
              ))}
              <th className="px-4 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 ${
                      redFrom != null && j >= redFrom && c !== "✓" ? "font-medium text-[#e11d2e]" : ""
                    }`}
                  >
                    {c === "✓" ? (
                      <input type="checkbox" defaultChecked readOnly />
                    ) : titleLinks && j === 1 ? (
                      <div>
                        <p>{c}</p>
                        <p className="mt-1 text-[11px]">
                          <span className="mr-2 text-[#2f6fed]">👁 View</span>
                          <span className="mr-2 text-emerald-600">Edit</span>
                          <span className="mr-2 text-[#2f6fed]">Copy</span>
                          <span className="text-[#e11d2e]">Delete</span>
                        </p>
                      </div>
                    ) : (
                      c
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 text-[#2f6fed]">
                  ✎ <span className="ml-2 text-[#e11d2e]">🗑</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-xs text-zinc-400">
          Hiển thị {visible.length} / {rows.length} dòng
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded bg-[#2f6fed] px-3 py-2 text-sm text-white">
          + Thêm mới
        </button>
        <button type="button" className="rounded bg-[#e11d2e] px-3 py-2 text-sm text-white">
          🗑 Xóa tất cả
        </button>
      </div>
    </div>
  );
}
