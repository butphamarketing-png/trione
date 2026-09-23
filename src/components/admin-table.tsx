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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applyDefaultImages(
  records: AdminRecord[],
  defaults: Record<string, string> | undefined,
  titleAt: number,
  replaceExisting: boolean
) {
  if (!defaults) return records;
  return records.map((record) => {
    const preset = defaults[record.cells[titleAt] ?? ""];
    if (!preset || (!replaceExisting && record.extra.image) || record.extra.image === preset) return record;
    return { ...record, extra: { ...record.extra, image: preset } };
  });
}

function blankColumnsOnPreset(records: AdminRecord[], names: string[], columns: string[] | undefined, enabled: boolean) {
  if (!enabled || !columns?.length) return records;
  const indexes = columns.map((name) => names.indexOf(name)).filter((index) => index >= 0);
  if (!indexes.length) return records;
  return records.map((record) => ({
    ...record,
    cells: record.cells.map((cell, index) => (indexes.includes(index) ? "" : cell)),
  }));
}

function applyParents(records: AdminRecord[], rows: string[][], parents: string[] | undefined, titleAt: number) {
  if (!parents?.length) return records;
  const byTitle = new Map<string, string>();
  rows.forEach((row, index) => {
    const parent = parents[index];
    const title = row[titleAt];
    if (parent && title) byTitle.set(title, parent);
  });
  return records.map((record) => {
    if (record.extra.category) return record;
    const parent = byTitle.get(record.cells[titleAt] ?? "") ?? "";
    if (!parent) return record;
    return { ...record, extra: { ...record.extra, category: parent } };
  });
}

function applySubs(records: AdminRecord[], rows: string[][], subs: string[] | undefined, titleAt: number) {
  if (!subs?.length) return records;
  const byTitle = new Map<string, string>();
  rows.forEach((row, index) => {
    const line = subs[index];
    const title = row[titleAt];
    if (line && title) byTitle.set(title, line);
  });
  return records.map((record) => {
    if (record.extra.subCategory) return record;
    const line = byTitle.get(record.cells[titleAt] ?? "") ?? "";
    if (!line) return record;
    return { ...record, extra: { ...record.extra, subCategory: line } };
  });
}

function applyCodes(records: AdminRecord[], rows: string[][], codes: string[] | undefined, titleAt: number) {
  if (!codes?.length) return records;
  const byTitle = new Map<string, string>();
  rows.forEach((row, index) => {
    const code = codes[index];
    const title = row[titleAt];
    if (code && title) byTitle.set(title, code);
  });
  return records.map((record) => {
    if (record.extra.sku) return record;
    const code = byTitle.get(record.cells[titleAt] ?? "") ?? "";
    if (!code) return record;
    return { ...record, extra: { ...record.extra, sku: code } };
  });
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
  defaultImages?: Record<string, string>;
  presetVersion?: string;
  blankColumns?: string[];
  codes?: string[];
  parents?: string[];
  subs?: string[];
  live?: boolean;
  wide?: boolean;
  redIndexes?: number[];
  onCommit?: (records: AdminRecord[]) => void;
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
  defaultImages,
  presetVersion,
  blankColumns,
  codes,
  parents,
  subs,
  live = false,
  wide = false,
  redIndexes,
  onCommit,
}: {
  title: string;
  columns: string[];
  rows: string[][];
  filters?: ReactNode;
  redFrom?: number;
  titleLinks?: boolean;
  defaultImages?: Record<string, string>;
  presetVersion?: string;
  blankColumns?: string[];
  codes?: string[];
  parents?: string[];
  subs?: string[];
  live?: boolean;
  wide?: boolean;
  redIndexes?: number[];
  onCommit?: (records: AdminRecord[]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const act = params.get("act");
  const editId = params.get("id");
  const mode = act === "add" || act === "edit" || act === "view" ? act : null;
  const signature = JSON.stringify(rows);
  const visibleIndex = columns.indexOf("Hiển thị");
  const imageIndex = columns.indexOf("Hình");
  const featuredIndex = columns.indexOf("Nổi bật");
  const nameIndex = columns.findIndex((column) => ["Tiêu đề", "Họ tên", "Tên", "Mã"].includes(column));
  const titleIndex = nameIndex >= 0 ? nameIndex : 1;
  const columnKey = columns.join("|");
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
    const width = columnKey.split("|").length;
    const names = columnKey.split("|");
    const featuredAt = names.indexOf("Nổi bật");
    const titleAt = ["Tiêu đề", "Họ tên", "Tên", "Mã"].map((name) => names.indexOf(name)).find((index) => index >= 0) ?? 1;
    const base =
      !live && saved && saved.length > 0 && saved.every((record) => record.cells.length === width)
        ? saved.map((record, index) => normalizeRecord(record, index))
        : seedRecords(parsed).map((record) => ({
            ...record,
            extra: {
              ...record.extra,
              featured: featuredAt >= 0 && record.cells[featuredAt] === "✓",
              seoTitle: record.cells[titleAt] ?? "",
            },
            cells: record.cells.map((cell, index) => (index === featuredAt ? "" : cell)),
          }));
    const versionKey = `trione-admin-preset:${title}`;
    const replaceExisting = Boolean(presetVersion) && sessionStorage.getItem(versionKey) !== presetVersion;
    const withImages = applyDefaultImages(base, defaultImages, titleAt, replaceExisting);
    const prepared = blankColumnsOnPreset(withImages, names, blankColumns, replaceExisting);
    const coded = applySubs(applyParents(applyCodes(prepared, parsed, codes, titleAt), parsed, parents, titleAt), parsed, subs, titleAt);
    if (presetVersion && replaceExisting) sessionStorage.setItem(versionKey, presetVersion);
    const changed =
      !saved ||
      coded.some(
        (record, index) =>
          record.extra.image !== base[index]?.extra.image ||
          record.extra.sku !== base[index]?.extra.sku ||
          record.extra.category !== base[index]?.extra.category ||
          record.extra.subCategory !== base[index]?.extra.subCategory ||
          record.cells.join("\u0000") !== base[index]?.cells.join("\u0000")
      );
    setRecords(changed ? saveRecords(title, coded) : reindex(coded));
  }, [title, signature, columnKey, defaultImages, presetVersion, blankColumns, codes, parents, subs, live]);

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
    onCommit?.(saved);
    return saved;
  }

  function save(current: AdminRecord, exitAfter: boolean) {
    const name = current.cells[titleIndex]?.trim() ?? "";
    if (!name) {
      setError(`Nhập ${columns[titleIndex] ?? "tiêu đề"} trước khi lưu.`);
      setNotice("");
      return;
    }
    const nextDraft = {
      ...current,
      cells: current.cells.map((cell, index) => (index === titleIndex ? name : cell)),
      extra: {
        ...current.extra,
        order: current.extra.order || current.cells[0] || "",
        slug: current.extra.slug || slugify(name),
      },
    };
    if (columns[0] === "STT") nextDraft.cells[0] = nextDraft.extra.order;
    const pool = (live ? records : peekRecords(title)) ?? records ?? [];
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
      cells: record.cells.map((cell, index) => (index === titleIndex ? `${cell} (copy)` : cell)),
      extra: { ...record.extra, order: String((records?.length ?? 0) + 1) },
    };
    commit([...(records ?? []), duplicate], `Đã sao chép «${record.cells[titleIndex]}».`);
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

  function toggleFeatured(record: AdminRecord) {
    if (featuredIndex < 0) return;
    commit(
      (records ?? []).map((item) =>
        item.id === record.id ? { ...item, extra: { ...item.extra, featured: !item.extra.featured } } : item
      ),
      ""
    );
  }

  function updateOrder(record: AdminRecord, order: string) {
    commit(
      (records ?? []).map((item) =>
        item.id === record.id
          ? { ...item, extra: { ...item.extra, order }, cells: item.cells.map((cell, index) => (index === 0 ? order : cell)) }
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
    const pool = live ? records : (peekRecords(title) ?? records);
    const initial =
      mode === "add"
        ? blankRecord(columns, String(pool.length + 1))
        : pool.find((record) => record.id === editId) ?? null;
    const screen = mode === "add" ? "Thêm mới" : mode === "view" ? "Xem chi tiết" : `Chi tiết ${title.replace(/^Danh sách /, "")}`;
    return (
      <div>
        <p className="mb-4 inline-block border-b-2 border-[#f6c445] pb-1 text-sm font-medium text-zinc-800">
          {screen}
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
      <Toolbar onAddHref={href("add")} onDelete={() => askRemove(selected)} q={q} onQuery={setQ} />
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        {filters && <div className="flex flex-wrap gap-2 px-4 pt-4">{filters}</div>}
        <h2 className="p-4 text-base font-semibold">{title}</h2>
        <table className={`${wide ? "min-w-max" : "w-full"} text-sm`}>
          <thead className="bg-[#f7d354] text-left text-zinc-900">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Chọn tất cả" className="accent-[#f6c445]" />
              </th>
              {columns.map((column) => (
                <th key={column} className={`px-4 py-3 font-semibold ${wide ? "whitespace-nowrap" : ""}`}>
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold">Thao tác</th>
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
                    aria-label={`Chọn ${record.cells[titleIndex] ?? ""}`}
                    className="accent-[#f6c445]"
                  />
                </td>
                {record.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={`px-4 py-3 ${wide ? "whitespace-nowrap" : ""} ${
                      (redIndexes?.includes(index) || (redIndexes == null && redFrom != null && index >= redFrom)) && cell !== "✓"
                        ? "font-medium text-[#e11d2e]"
                        : ""
                    }`}
                  >
                    {index === 0 && columns[0] === "STT" ? (
                      <input
                        key={`${record.id}-${record.extra.order}`}
                        defaultValue={record.extra.order || cell}
                        inputMode="numeric"
                        onBlur={(event) => {
                          if (event.target.value !== (record.extra.order || cell)) updateOrder(record, event.target.value);
                        }}
                        aria-label={`Số thứ tự ${record.cells[titleIndex] ?? ""}`}
                        className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-[#e2b100]"
                      />
                    ) : index === imageIndex ? (
                      <a href={href("edit", record.id)} className="inline-block">
                        {record.extra.image ? (
                          <img src={record.extra.image} alt="" className="h-14 w-14 rounded object-cover" />
                        ) : (
                          <span className="grid h-14 w-14 place-items-center rounded bg-zinc-100 text-[10px] text-zinc-400">Ảnh</span>
                        )}
                      </a>
                    ) : index === featuredIndex ? (
                      <input
                        type="checkbox"
                        checked={record.extra.featured}
                        onChange={() => toggleFeatured(record)}
                        aria-label={`Nổi bật ${record.cells[titleIndex] ?? ""}`}
                        className="accent-[#f6c445]"
                      />
                    ) : index === visibleIndex ? (
                      <input
                        type="checkbox"
                        checked={cell === "✓"}
                        onChange={() => toggleVisible(record)}
                        aria-label={`Hiển thị ${record.cells[titleIndex] ?? ""}`}
                        className="accent-[#f6c445]"
                      />
                    ) : titleLinks && index === titleIndex ? (
                      <div>
                        <a href={href("edit", record.id)} className="font-medium hover:underline">
                          {cell}
                        </a>
                        {imageIndex < 0 ? (
                          <p className="mt-1 text-[11px]">
                            <a href={href("view", record.id)} className="mr-2 text-[#2f6fed] hover:underline">
                              Xem
                            </a>
                            <a href={href("edit", record.id)} className="mr-2 text-emerald-600 hover:underline">
                              Sửa
                            </a>
                            <button type="button" onClick={() => copy(record)} className="mr-2 text-[#2f6fed] hover:underline">
                              Sao chép
                            </button>
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4">
                  <a href={href("edit", record.id)} title="Chỉnh sửa" aria-label="Chỉnh sửa" className="text-zinc-700 hover:text-black">
                    ✎
                  </a>
                  <button type="button" title="Xóa" aria-label="Xóa" onClick={() => askRemove([record.id])} className="ml-3 text-[#e11d2e]">
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
                ? `Xóa «${records.find((record) => record.id === pendingDelete[0])?.cells[titleIndex] || "mục này"}»?`
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
  const [baseline] = useState(() => {
    if (!initial) return null;
    const copy = cloneRecord(initial);
    const nameAt = columns.findIndex((column) => ["Tiêu đề", "Họ tên", "Tên", "Mã"].includes(column));
    const index = nameAt >= 0 ? nameAt : 1;
    if (!copy.extra.slug) copy.extra.slug = slugify(copy.cells[index] ?? "");
    return copy;
  });
  const [draft, setDraft] = useState(() => (baseline ? cloneRecord(baseline) : null));
  if (!draft || !baseline) {
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
      baseline={baseline}
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
  q,
  onQuery,
}: {
  onAddHref: string;
  onDelete: () => void;
  q: string;
  onQuery: (value: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex min-w-[260px] flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <input
          value={q}
          onChange={(event) => onQuery(event.target.value)}
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          placeholder="Tìm kiếm nhanh"
        />
        <span className="grid place-items-center bg-[#f6c445] px-4 text-sm">⌕</span>
      </div>
      <a href={onAddHref} className="rounded-lg bg-[#f6c445] px-4 py-2 text-sm font-medium">
        + Thêm mới
      </a>
      <button type="button" onClick={onDelete} className="rounded-lg bg-[#f07181] px-4 py-2 text-sm font-medium text-white">
        Xóa tất cả
      </button>
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
