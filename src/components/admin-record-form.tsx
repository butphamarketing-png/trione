import { useState, type ReactNode } from "react";
import type { AdminExtra, AdminRecord } from "@/lib/admin-records";

const inputClass = "w-full max-w-xl rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#2f6fed] disabled:bg-zinc-50";

export function AdminRecordForm({
  columns,
  draft,
  mode,
  onChange,
  onSave,
  onExit,
  onEdit,
}: {
  columns: string[];
  draft: AdminRecord;
  mode: "add" | "edit" | "view";
  onChange: (next: AdminRecord) => void;
  onSave: (exit: boolean) => void;
  onExit: () => void;
  onEdit: () => void;
}) {
  const readOnly = mode === "view";
  const visibleIndex = columns.indexOf("Hiển thị");
  const showSeo = columns.includes("Tiêu đề");
  const heading = mode === "add" ? "Thêm mới" : mode === "view" ? "Xem chi tiết" : "Chỉnh sửa";
  const name = draft.cells[1]?.trim();
  const [fileError, setFileError] = useState("");

  function setCell(index: number, value: string) {
    onChange({ ...draft, cells: draft.cells.map((cell, i) => (i === index ? value : cell)) });
  }

  function setExtra<K extends keyof AdminExtra>(key: K, value: AdminExtra[K]) {
    onChange({ ...draft, extra: { ...draft.extra, [key]: value } });
  }

  function onImage(file: File | undefined) {
    if (!file || readOnly) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Chỉ nhận file ảnh.");
      return;
    }
    if (file.size > 500_000) {
      setFileError("Ảnh tối đa 500KB.");
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = () => setExtra("image", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function setVisible(checked: boolean) {
    if (visibleIndex < 0) return;
    setCell(visibleIndex, checked ? "✓" : "");
  }

  return (
    <form
      className="overflow-hidden rounded-sm border border-zinc-200 border-t-4 border-t-[#2f6fed] bg-white"
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) onSave(false);
      }}
    >
      <h2 className="border-b px-4 py-3 font-semibold">
        {heading}
        {name ? `: ${name}` : ""}
      </h2>
      <div className="divide-y">
        {columns.map((column, index) => {
          if (index === 0 || index === visibleIndex) return null;
          return (
            <Field key={column} label={column}>
              <input
                value={draft.cells[index] ?? ""}
                disabled={readOnly}
                onChange={(event) => setCell(index, event.target.value)}
                className={inputClass}
              />
            </Field>
          );
        })}
        {showSeo && (
          <>
            <Field label="Title">
              <input
                value={draft.extra.seoTitle}
                disabled={readOnly}
                onChange={(event) => setExtra("seoTitle", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Keywords">
              <textarea
                value={draft.extra.keywords}
                disabled={readOnly}
                rows={3}
                onChange={(event) => setExtra("keywords", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={draft.extra.description}
                disabled={readOnly}
                rows={3}
                onChange={(event) => setExtra("description", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                value={draft.extra.summary}
                disabled={readOnly}
                rows={8}
                onChange={(event) => setExtra("summary", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Hình ảnh">
              <div>
                {draft.extra.image ? (
                  <img src={draft.extra.image} alt="" className="mb-2 h-24 w-24 rounded border object-cover" />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  disabled={readOnly}
                  onChange={(event) => onImage(event.target.files?.[0])}
                  className="block text-sm"
                />
                {draft.extra.image && !readOnly ? (
                  <button type="button" onClick={() => setExtra("image", "")} className="mt-2 text-xs text-[#e11d2e]">
                    Xóa ảnh
                  </button>
                ) : null}
                {fileError ? <p className="mt-1 text-xs text-[#e11d2e]">{fileError}</p> : null}
              </div>
            </Field>
            <Field label="Nổi bật">
              <input
                type="checkbox"
                checked={draft.extra.featured}
                disabled={readOnly}
                onChange={(event) => setExtra("featured", event.target.checked)}
                className="h-4 w-4"
              />
            </Field>
          </>
        )}
        <Field label="Số thứ tự">
          <input
            value={draft.extra.order}
            disabled={readOnly}
            inputMode="numeric"
            onChange={(event) => setExtra("order", event.target.value)}
            className={`${inputClass} max-w-[120px]`}
          />
        </Field>
        {visibleIndex >= 0 && (
          <Field label="Hiển thị">
            <input
              type="checkbox"
              checked={draft.cells[visibleIndex] === "✓"}
              disabled={readOnly}
              onChange={(event) => setVisible(event.target.checked)}
              className="h-4 w-4"
            />
          </Field>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t px-4 py-4">
        {readOnly ? (
          <button type="button" onClick={onEdit} className="rounded bg-emerald-600 px-4 py-2 text-sm text-white">
            Chỉnh sửa
          </button>
        ) : (
          <>
            <button type="submit" className="rounded bg-[#2f6fed] px-4 py-2 text-sm text-white">
              Lưu
            </button>
            <button type="button" onClick={() => onSave(true)} className="rounded bg-emerald-600 px-4 py-2 text-sm text-white">
              Lưu và thoát
            </button>
          </>
        )}
        <button type="button" onClick={onExit} className="rounded bg-zinc-500 px-4 py-2 text-sm text-white">
          Thoát
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-start">
      <span className="pt-2 text-sm text-zinc-600">{label}</span>
      {children}
    </div>
  );
}
