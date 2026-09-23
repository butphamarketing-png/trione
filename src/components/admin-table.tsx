"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AdminRecordForm } from "@/components/admin-record-form";
import {
  blankExtra,
  cloneRecord,
  loadRecords,
  normalizeRecord,
  peekRecords,
  reindex,
  saveRecords,
  seedRecords,
  type AdminRecord,
} from "@/lib/admin-records";

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const all = [header, ...rows];
  const csv = all
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function blankRecord(columns: string[], order: string): AdminRecord {
  const visibleIndex = columns.indexOf("Hiển thị");
  const cells = columns.map((_, index) => (index === visibleIndex ? "✓" : ""));
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cells,
    extra: { ...blankExtra(order), seoTitle: "" },
  };
}

export function AdminTable(props: {
  title: string;
  columns: string[];
  rows: string[][];
  filters?: ReactNode;
  redFrom?: number;
  titleLinks?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <AdminTableInner {...props} />
    </Suspense>
  );
}

function AdminTableInner({
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
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const act = params.get("act");
  const editId = params.get("id");
  const mode = act === "add" || act === "edit" || act === "view" ? act : null;
  const signature = JSON.stringify(rows);
  const visibleIndex = columns.indexOf("Hiển thị");
  const [records, setRecords] = useState<AdminRecord[] | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [alertText, setAlertText] = useState("");
  const keepNotice = useRef(false);

  useEffect(() => {
    const parsed = JSON.parse(signature) as string[][];
    const saved = loadRecords(title);
    setRecords(saved ? reindex(saved.map((record, index) => normalizeRecord(record, index))) : seedRecords(parsed));
  }, [title, signature]);

  useEffect(() => {
    if (keepNotice.current) {
      keepNotice.current = false;
      return;
    }
    setNotice("");
    setError("");
  }, [mode, editId]);

  const visible = useMemo(
    () => (records ?? []).filter((record) => !q.trim() || record.cells.join(" ").toLowerCase().includes(q.toLowerCase())),
    [records, q]
  );
  const allChecked = visible.length > 0 && visible.every((record) => selected.includes(record.id));

  function href(nextAct: "add" | "edit" | "view", id?: string) {
    const query = new URLSearchParams();
    query.set("act", nextAct);
    if (id) query.set("id", id);
    return `${pathname}?${query.toString()}`;
  }

  function exit() {
    setError("");
    router.push(pathname);
  }

  function commit(next: AdminRecord[], message: string) {
    const saved = saveRecords(title, next);
    setRecords(saved);
    keepNotice.current = Boolean(message);
    setNotice(message);
    setError("");
    return saved;
  }

  function save(current: AdminRecord, exitAfter: boolean) {
    const name = current.cells[1]?.trim() ?? "";
    if (!name) {
      setError(`Nhập ${columns[1] ?? "tiêu đề"} trước khi lưu.`);
      setNotice("");
      return;
    }
    const nextDraft = { ...current, cells: current.cells.map((cell, index) => (index === 1 ? name : cell)) };
    const pool = peekRecords(title) ?? records ?? [];
    if (mode === "add") {
      commit([...pool.filter((record) => record.id !== nextDraft.id), nextDraft], "Đã lưu.");
      if (exitAfter) exit();
      else router.replace(href("edit", nextDraft.id));
      return;
    }
    commit(
      pool.map((record) => (record.id === nextDraft.id ? nextDraft : record)),
      "Đã lưu."
    );
    if (exitAfter) exit();
  }

  function copy(record: AdminRecord) {
    const duplicate: AdminRecord = {
      ...cloneRecord(record),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cells: record.cells.map((cell, index) => (index === 1 ? `${cell} (copy)` : cell)),
      extra: { ...record.extra, order: String((records?.length ?? 0) + 1) },
    };
    commit([...(records ?? []), duplicate], `Đã sao chép «${record.cells[1]}».`);
  }

  function askRemove(ids: string[]) {
    if (!ids.length) {
      setNotice("");
      setError("");
      setAlertText("Bạn chưa chọn mục nào.");
      return;
    }
    setError("");
    setAlertText("");
    setPendingDelete(ids);
  }

  function confirmRemove() {
    if (!pendingDelete?.length) return;
    const ids = pendingDelete;
    commit(
      (records ?? []).filter((record) => !ids.includes(record.id)),
      ids.length === 1 ? "Đã xóa." : `Đã xóa ${ids.length} mục.`
    );
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    setPendingDelete(null);
  }

  function toggleVisible(record: AdminRecord) {
    if (visibleIndex < 0) return;
    commit(
      (records ?? []).map((item) =>
        item.id === record.id
          ? {
              ...item,
              cells: item.cells.map((cell, index) =>
                index === visibleIndex ? (cell === "✓" ? "" : "✓") : cell
              ),
            }
          : item
      ),
      ""
    );
  }

  function toggleAll() {
    setSelected(allChecked ? [] : visible.map((record) => record.id));
  }

  function toggleOne(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  if (!records) {
    return <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-4 text-sm text-zinc-500">Đang tải...</div>;
  }

  if (mode) {
    const pool = peekRecords(title) ?? records;
    const initial =
      mode === "add"
        ? blankRecord(columns, String(pool.length + 1))
        : pool.find((record) => record.id === editId) ?? null;
    const screen = mode === "add" ? "Thêm mới" : mode === "view" ? "Xem chi tiết" : "Chỉnh sửa";
    return (
      <div>
        <p className="mb-3 text-sm text-[#2f6fed]">
          {title} / {screen}
        </p>
        <Status notice={notice} error={error} />
        <RecordEditor
          key={`${mode}:${editId ?? "new"}`}
          columns={columns}
          initial={initial ? cloneRecord(initial) : null}
          mode={mode}
          onSave={save}
          onExit={exit}
          onEdit={(id) => router.push(href("edit", id))}
        />
      </div>
    );
  }

  return (
    <div>
      <Status notice={notice} error={error} />
      <Toolbar
        onAddHref={href("add")}
        onDelete={() => askRemove(selected)}
        onExport={() => downloadCsv(`${title}.csv`, columns, visible.map((record) => record.cells))}
        q={q}
        onQuery={setQ}
      />
      <div className="overflow-x-auto rounded-sm border-t-4 border-[#2f6fed] bg-white">
        {filters && <div className="flex flex-wrap gap-2 px-4 pt-4">{filters}</div>}
        <h2 className="p-4 font-semibold">{title}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-500">
            <tr>
              <th className="w-8 px-4 py-2">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Chọn tất cả" />
              </th>
              {columns.map((column) => (
                <th key={column} className="px-4 py-2">
                  {column}
                </th>
              ))}
              <th className="px-4 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => (
              <tr key={record.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(record.id)}
                    onChange={() => toggleOne(record.id)}
                    aria-label={`Chọn ${record.cells[1] ?? ""}`}
                  />
                </td>
                {record.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={`px-4 py-3 ${
                      redFrom != null && index >= redFrom && cell !== "✓" ? "font-medium text-[#e11d2e]" : ""
                    }`}
                  >
                    {index === visibleIndex ? (
                      <input
                        type="checkbox"
                        checked={cell === "✓"}
                        onChange={() => toggleVisible(record)}
                        aria-label={`Hiển thị ${record.cells[1] ?? ""}`}
                      />
                    ) : titleLinks && index === 1 ? (
                      <div>
                        <p>{cell}</p>
                        <p className="mt-1 text-[11px]">
                          <a href={href("view", record.id)} className="mr-2 text-[#2f6fed] hover:underline">
                            👁 View
                          </a>
                          <a href={href("edit", record.id)} className="mr-2 text-emerald-600 hover:underline">
                            Edit
                          </a>
                          <button type="button" onClick={() => copy(record)} className="mr-2 text-[#2f6fed] hover:underline">
                            Copy
                          </button>
                          <button type="button" onClick={() => askRemove([record.id])} className="text-[#e11d2e] hover:underline">
                            Delete
                          </button>
                        </p>
                      </div>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4">
                  <a href={href("edit", record.id)} title="Chỉnh sửa" aria-label="Chỉnh sửa" className="text-[#2f6fed] hover:underline">
                    ✎
                  </a>
                  <button
                    type="button"
                    title="Xóa"
                    onClick={() => askRemove([record.id])}
                    className="ml-2 text-[#e11d2e]"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-xs text-zinc-400">
          Hiển thị {visible.length} / {records.length} dòng
        </p>
      </div>
      <Toolbar onAddHref={href("add")} onDelete={() => askRemove(selected)} bottom />
      {alertText && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-5 shadow-lg">
            <p className="text-sm">{alertText}</p>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setAlertText("")} className="rounded bg-[#2f6fed] px-3 py-1.5 text-sm text-white">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-5 shadow-lg">
            <p className="text-sm">
              {pendingDelete.length === 1
                ? `Xóa «${records.find((record) => record.id === pendingDelete[0])?.cells[1] || "mục này"}»?`
                : `Xóa ${pendingDelete.length} mục đã chọn?`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded bg-zinc-200 px-3 py-1.5 text-sm">
                Hủy
              </button>
              <button type="button" onClick={confirmRemove} className="rounded bg-[#e11d2e] px-3 py-1.5 text-sm text-white">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordEditor({
  columns,
  initial,
  mode,
  onSave,
  onExit,
  onEdit,
}: {
  columns: string[];
  initial: AdminRecord | null;
  mode: "add" | "edit" | "view";
  onSave: (record: AdminRecord, exitAfter: boolean) => void;
  onExit: () => void;
  onEdit: (id: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  if (!draft) {
    return (
      <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-4">
        <p className="text-sm">Không tìm thấy mục này.</p>
        <button type="button" onClick={onExit} className="mt-3 rounded bg-zinc-500 px-4 py-2 text-sm text-white">
          Thoát
        </button>
      </div>
    );
  }
  return (
    <AdminRecordForm
      columns={columns}
      draft={draft}
      mode={mode}
      onChange={setDraft}
      onSave={(exitAfter) => onSave(draft, exitAfter)}
      onExit={onExit}
      onEdit={() => onEdit(draft.id)}
    />
  );
}

function Toolbar({
  onAddHref,
  onDelete,
  onExport,
  q,
  onQuery,
  bottom,
}: {
  onAddHref: string;
  onDelete: () => void;
  onExport?: () => void;
  q?: string;
  onQuery?: (value: string) => void;
  bottom?: boolean;
}) {
  return (
    <div className={`${bottom ? "mt-3" : "mb-3"} flex flex-wrap items-center gap-2`}>
      <a href={onAddHref} className="rounded bg-[#2f6fed] px-3 py-2 text-sm text-white">
        + Thêm mới
      </a>
      <button type="button" onClick={onDelete} className="rounded bg-[#e11d2e] px-3 py-2 text-sm text-white">
        🗑 Xóa tất cả
      </button>
      {!bottom && onExport && onQuery && (
        <>
          <button type="button" onClick={onExport} className="rounded bg-emerald-600 px-3 py-2 text-sm text-white">
            ↥ Export Excel
          </button>
          <div className="flex overflow-hidden rounded border bg-white">
            <input
              value={q}
              onChange={(event) => onQuery(event.target.value)}
              className="px-3 py-2 text-sm outline-none"
              placeholder="Tìm kiếm"
            />
            <span className="grid place-items-center bg-zinc-50 px-3 text-zinc-400">⌕</span>
          </div>
        </>
      )}
    </div>
  );
}

function Status({ notice, error }: { notice: string; error: string }) {
  if (!notice && !error) return null;
  return (
    <p className={`mb-3 rounded px-3 py-2 text-sm ${error ? "bg-red-50 text-[#e11d2e]" : "bg-emerald-50 text-emerald-700"}`}>
      {error || notice}
    </p>
  );
}
