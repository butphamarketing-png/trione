import { useEffect, useRef, useState, type ReactNode } from "react";
import { bodyOptions, brands, issues, lines, models, screenOptions } from "@/data/catalog";
import { cloneRecord, normalizeConditionPrices, normalizeGradePrices, type AdminAlbumImage, type AdminExtra, type AdminRecord } from "@/lib/admin-records";
import { fileToDataUrl } from "@/lib/demo-media";
import { defaultSiteSettings, readSiteSettings, useSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { readLevel1Categories, type Level1Category } from "@/lib/level1-categories";
import { readLevel2Categories, type Level2Category } from "@/lib/level2-categories";


function clipText(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function fitParts(parts: string[], max: number) {
  let text = "";
  for (const part of parts) {
    const next = text ? `${text} ${part}` : part;
    if (next.length > max) break;
    text = next;
  }
  return text;
}

function buildSeo(title: string, path: string, product: boolean, site: SiteSettings = defaultSiteSettings) {
  const origin = site.website.replace(/\/$/, "") || "https://trione.vn";
  const url = path ? `${origin}/${path}` : `${origin}/`;
  return {
    seoTitle: clipText(`${title} | ${site.company}`, 70),
    keywords: clipText(`${title}, ${site.company}, thu cũ, đổi mới, đồng hồ`, 70),
    description: fitParts(
      [`${title} tại ${site.company}.`, `${site.slogan}.`, `Hotline ${site.hotline}.`, `${site.address}.`],
      160
    ),
    summary: clipText(title, 100),
    canonical: url,
    ogSite: site.company,
    ogType: product ? "product" : "website",
    ogUrl: url,
    robots: "index" as const,
  };
}

const priceColumns = ["Giá loại 1", "Giá loại 2", "Giá loại 3", "Giá loại 4", "Giá loại 5"];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e2b100] disabled:bg-zinc-50";

function MoneyField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block">{label}</span>
      <span className="flex items-center gap-2">
        <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={inputClass} />
        <span className="text-xs text-zinc-400">VNĐ</span>
      </span>
    </label>
  );
}
const skipColumns = new Set(["STT", "Hiển thị", "Hình", "Nổi bật", "Tiêu đề", "Số sản phẩm"]);

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

export function AdminRecordForm({
  columns,
  draft,
  baseline,
  mode,
  onChange,
  onSave,
  onExit,
  onEdit,
}: {
  columns: string[];
  draft: AdminRecord;
  baseline: AdminRecord;
  mode: "add" | "edit" | "view";
  onChange: (next: AdminRecord) => void;
  onSave: (exit: boolean) => void;
  onExit: () => void;
  onEdit: () => void;
}) {
  const site = useSiteSettings();
  const readOnly = mode === "view";
  const visibleIndex = columns.indexOf("Hiển thị");
  const titleIndex = Math.max(columns.indexOf("Tiêu đề"), 1);
  const showCazo = columns.includes("Tiêu đề");
  const isProduct = columns.includes("Giá loại 1");
  const parentIndex = columns.indexOf("Danh mục cấp 1");
  const [level1Parents, setLevel1Parents] = useState<Level1Category[]>([]);
  const [level2Options, setLevel2Options] = useState<Level2Category[]>([]);
  const stayOnPage = columns.some((column) => column.includes("Giá"));
  const name = draft.cells[titleIndex]?.trim() ?? "";
  const [fileError, setFileError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const albumInput = useRef<HTMLInputElement>(null);
  const [slugFollow, setSlugFollow] = useState(mode === "add");
  const [slugTouched, setSlugTouched] = useState(false);
  const [seoAsk, setSeoAsk] = useState(false);
  const [seoNote, setSeoNote] = useState("");
  const [pickedAlbum, setPickedAlbum] = useState<string[]>([]);
  const photoSize = columns.some((column) => column.includes("Giá")) ? "600 px × 560 px" : "600 px × 400 px";

  function setCell(index: number, value: string) {
    onChange({ ...draft, cells: draft.cells.map((cell, i) => (i === index ? value : cell)) });
  }

  function setExtra<K extends keyof AdminExtra>(key: K, value: AdminExtra[K]) {
    onChange({ ...draft, extra: { ...draft.extra, [key]: value } });
  }

  function setTitle(value: string) {
    const cells = draft.cells.map((cell, i) => (i === titleIndex ? value : cell));
    const extra = slugFollow ? { ...draft.extra, slug: slugify(value) } : draft.extra;
    if (slugFollow) setSlugTouched(true);
    onChange({ ...draft, cells, extra });
  }

  async function onImage(file: File | undefined) {
    if (!file || readOnly) return;
    if (!isImageFile(file)) {
      setFileError("Chỉ nhận file ảnh.");
      return;
    }
    setFileError("");
    setImageBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file, 900);
      if (!dataUrl.startsWith("data:image/")) {
        setFileError("Không đọc được ảnh. Hãy chọn file JPG hoặc PNG.");
        return;
      }
      setExtra("image", dataUrl);
    } catch {
      setFileError("Không đọc được ảnh. Hãy chọn file JPG hoặc PNG.");
    } finally {
      setImageBusy(false);
    }
  }

  function createSeo() {
    const title = name.trim();
    if (!title) {
      setSeoNote("Nhập tiêu đề trước khi tạo SEO.");
      setSeoAsk(false);
      return;
    }
    const path = draft.extra.slug || slugify(title);
    onChange({ ...draft, extra: { ...draft.extra, slug: path, ...buildSeo(title, path, isProduct, readSiteSettings()) } });
    setSeoNote("Đã điền Nội dung SEO từ tiêu đề và thông tin TRIONE.VN.");
    setSeoAsk(false);
    requestAnimationFrame(() => document.getElementById("noi-dung-seo")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const slug = draft.extra.slug || slugify(name);
  const origin = site.website.replace(/\/$/, "") || "https://trione.vn";
  const sample = slug ? `${origin}/${slug}` : `${origin}/`;
  const discount = discountPercent(draft.extra.salePrice, draft.extra.newPrice);
  const album = draft.extra.album ?? [];

  useEffect(() => {
    if (parentIndex < 0 && !isProduct) return;
    setLevel1Parents(readLevel1Categories(true));
    if (isProduct) setLevel2Options(readLevel2Categories());
  }, [parentIndex, isProduct]);

  useEffect(() => {
    const extra = { ...draft.extra, album: draft.extra.album ?? [] };
    let changed = false;
    if (!extra.slug && name) {
      extra.slug = slugify(name);
      changed = true;
    }
    if (isProduct) {
      const model = models.find((item) => item.name === name);
      const line = lines.find((item) => item.id === model?.lineId);
      const brand = brands.find((item) => item.id === line?.brandId);
      const price = draft.cells[columns.indexOf("Giá loại 1")] ?? "";
      if ((!extra.category || extra.category === "Đồng hồ" || brands.some((item) => item.name === extra.category)) && brand) {
        extra.category = brand.id;
        changed = true;
      }
      if ((!extra.subCategory || lines.some((item) => item.name === extra.subCategory) || brands.some((item) => item.name === extra.subCategory)) && line) {
        extra.subCategory = line.id;
        changed = true;
      }
      if (!extra.shortDesc && model?.blurb) {
        extra.shortDesc = model.blurb;
        changed = true;
      }
      if (!extra.sku && model) {
        extra.sku = model.id;
        changed = true;
      }
      if (!extra.salePrice && price) {
        extra.salePrice = price;
        changed = true;
      }
      if (!extra.newPrice && price) {
        extra.newPrice = price;
        changed = true;
      }
    }
    if (changed) onChange({ ...draft, extra });
    // Fill defaults once, when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addAlbum(files: FileList | File[] | null | undefined) {
    const list = [...(files ?? [])].filter(isImageFile).slice(0, 8);
    if (!list.length || readOnly) return;
    setFileError("");
    setImageBusy(true);
    try {
      const images = (
        await Promise.all(
          list.map(async (file) => {
            const src = await fileToDataUrl(file, 700);
            if (!src.startsWith("data:image/")) return null;
            return {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              src,
              order: "",
              title: "",
            } satisfies AdminAlbumImage;
          })
        )
      ).filter((item): item is AdminAlbumImage => item !== null);
      if (!images.length) {
        setFileError("Không đọc được ảnh. Hãy chọn file JPG hoặc PNG.");
        return;
      }
      const next = [...album, ...images].map((item, index) => ({ ...item, order: item.order || String(index + 1) }));
      onChange({ ...draft, extra: { ...draft.extra, album: next } });
    } catch {
      setFileError("Không đọc được ảnh. Hãy chọn file JPG hoặc PNG.");
    } finally {
      setImageBusy(false);
    }
  }

  function updateAlbum(id: string, patch: Partial<AdminAlbumImage>) {
    setExtra(
      "album",
      album.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeAlbum(ids: string[]) {
    setExtra(
      "album",
      album.filter((item) => !ids.includes(item.id))
    );
    setPickedAlbum((current) => current.filter((id) => !ids.includes(id)));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) onSave(true);
      }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {readOnly ? (
          <button type="button" onClick={onEdit} className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium">
            Chỉnh sửa
          </button>
        ) : (
          <>
            <button type="submit" className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium">
              Lưu
            </button>
            {stayOnPage ? (
              <button type="button" onClick={() => onSave(false)} className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium">
                Lưu tại trang
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(cloneRecord(baseline))}
              className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium"
            >
              Làm lại
            </button>
          </>
        )}
        <button type="button" onClick={onExit} className="rounded-lg bg-[#f07181] px-5 py-2 text-sm font-medium text-white">
          Thoát
        </button>
      </div>

      {showCazo ? (
        <div className="space-y-5">
          {isProduct ? (
            <Section title="Danh mục Sản phẩm">
              <label className="mb-3 block text-sm">
                <span className="mb-1 block">Danh mục cấp 1:</span>
                <select
                  value={level1Parents.find((item) => item.code === draft.extra.category || item.name === draft.extra.category)?.code ?? ""}
                  disabled={readOnly}
                  onChange={(event) => {
                    const code = event.target.value;
                    const currentLine = level2Options.find((item) => item.code === draft.extra.subCategory || item.name === draft.extra.subCategory);
                    const keepLine = currentLine?.parent === code;
                    onChange({
                      ...draft,
                      extra: { ...draft.extra, category: code, subCategory: keepLine ? currentLine.code : "" },
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">Chọn danh mục cấp 1</option>
                  {level1Parents.map((item) => (
                    <option key={item.key} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Danh mục cấp 2:</span>
                <select
                  value={level2Options.find((item) => item.code === draft.extra.subCategory || item.name === draft.extra.subCategory)?.code ?? ""}
                  disabled={readOnly}
                  onChange={(event) => setExtra("subCategory", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn danh mục cấp 2</option>
                  {level2Options
                    .filter((item) => {
                      const parent = level1Parents.find((entry) => entry.code === draft.extra.category || entry.name === draft.extra.category)?.code;
                      return !parent || item.parent === parent;
                    })
                    .map((item) => (
                      <option key={item.key} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-zinc-400">Sản phẩm hiện ở bước 3. Đường dẫn dạng /thu-cu/apple/apple-watch-ultra/apple-watch-ultra-2.</p>
              </label>
            </Section>
          ) : null}
          <Section title="Đường dẫn" note="(Vui lòng không nhập trùng tiêu đề)">
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={slugFollow}
                disabled={readOnly}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setSlugFollow(checked);
                  if (checked) setExtra("slug", slugify(name));
                }}
              />
              Thay đổi đường dẫn theo tiêu đề mới:
            </label>
            <p className="mb-2 text-sm">
              Đường dẫn mẫu:{" "}
              <a href={sample} className="text-[#2f6fed]" onClick={(event) => event.preventDefault()}>
                {sample}
              </a>
            </p>
            <input
              value={draft.extra.slug}
              disabled={readOnly}
              placeholder="Link đường dẫn"
              onChange={(event) => {
                setSlugFollow(false);
                setSlugTouched(true);
                setExtra("slug", slugify(event.target.value));
              }}
              className={inputClass}
            />
            {slugTouched && slug ? <p className="mt-1 text-xs text-emerald-600">Đường dẫn hợp lệ</p> : null}
          </Section>

          <Section title={isProduct ? "Nội dung Sản phẩm" : "Nội dung"}>
            <label className="mb-1 block text-sm" htmlFor="record-title">
              {isProduct ? "Tiêu đề (vi):" : "Tiêu đề:"}
            </label>
            <div className="flex items-start gap-2">
              <input
                id="record-title"
                value={draft.cells[titleIndex] ?? ""}
                disabled={readOnly}
                onChange={(event) => {
                  setSeoNote("");
                  setTitle(event.target.value);
                }}
                className={inputClass}
                required
              />
              {readOnly ? null : (
                <button type="button" onClick={createSeo} className="shrink-0 rounded-lg bg-[#f6c445] px-3 py-2 text-sm font-medium">
                  Tạo SEO
                </button>
              )}
            </div>
            {seoNote ? <p className={`mt-1 text-xs ${seoNote.startsWith("Đã") ? "text-emerald-600" : "text-[#e11d2e]"}`}>{seoNote}</p> : null}
            {isProduct ? (
              <>
                <div className="mb-3 mt-3 flex border-b border-zinc-200 text-sm">
                  <span className="border-b-2 border-[#f6c445] px-3 py-1.5 font-medium">Tiếng Việt</span>
                </div>
                <label className="mb-1 block text-sm">Mô tả (vi):</label>
                <textarea
                  value={draft.extra.shortDesc}
                  disabled={readOnly}
                  rows={2}
                  onChange={(event) => setExtra("shortDesc", event.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-400">Hiện cùng hình ảnh và tiêu đề khi khách chọn mẫu trên trang chủ.</p>
                <p className="mb-1 mt-3 text-sm">Nội dung (vi):</p>
                <RichText value={draft.extra.body} disabled={readOnly} onChange={(value) => setExtra("body", value)} />
              </>
            ) : null}
          </Section>

          <Section title={isProduct ? "Hình ảnh Sản phẩm" : "Hình ảnh"}>
            <div
              className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onImage(event.dataTransfer.files?.[0]);
              }}
            >
              {draft.extra.image ? (
                <img src={draft.extra.image} alt="" className="mx-auto mb-3 h-28 w-40 rounded object-cover" />
              ) : null}
              <p className="text-sm text-zinc-500">Kéo và thả hình vào đây</p>
              <p className="my-1 text-xs text-zinc-400">hoặc</p>
              <button
                type="button"
                disabled={readOnly || imageBusy}
                onClick={() => imageInput.current?.click()}
                className="inline-block cursor-pointer rounded-lg bg-[#3dbe7a] px-3 py-1.5 text-sm text-white disabled:opacity-60"
              >
                {imageBusy ? "Đang xử lý..." : "Chọn hình"}
              </button>
              <input
                ref={imageInput}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                disabled={readOnly || imageBusy}
                className="sr-only"
                onChange={(event) => {
                  onImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <p className="mt-2 text-xs text-zinc-400">Kích thước ảnh: Width {photoSize.split("×")[0]?.trim()} · Height {photoSize.split("×")[1]?.trim()} (.jpg .png .gif .webp). Ảnh lớn được thu nhỏ và nén tự động.</p>
              {fileError ? <p className="mt-1 text-xs text-[#e11d2e]">{fileError}</p> : null}
            </div>
          </Section>

          {isProduct ? (
            <Section title="Bộ sưu tập Sản phẩm">
              <p className="mb-2 text-sm">Album hình: (.jpg .png .gif)</p>
              <div
                className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  addAlbum(event.dataTransfer.files);
                }}
              >
                <p className="text-sm text-zinc-500">Kéo và thả hình vào đây</p>
                <p className="my-1 text-xs text-zinc-400">hoặc</p>
                <button
                  type="button"
                  disabled={readOnly || imageBusy}
                  onClick={() => albumInput.current?.click()}
                  className="inline-block cursor-pointer rounded-lg bg-[#3dbe7a] px-3 py-1.5 text-sm text-white disabled:opacity-60"
                >
                  {imageBusy ? "Đang xử lý..." : "Chọn hình"}
                </button>
                <input
                  ref={albumInput}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                  multiple
                  disabled={readOnly || imageBusy}
                  className="sr-only"
                  onChange={(event) => {
                    addAlbum(event.target.files);
                    event.target.value = "";
                  }}
                />
                <p className="mt-2 text-xs text-zinc-400">Kích thước ảnh album: Width 700 px · Height 700 px. Ảnh lớn được thu nhỏ và nén tự động.</p>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Album hiện tại:</span>
                  <span className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={album.length > 0 && pickedAlbum.length === album.length}
                        disabled={readOnly || !album.length}
                        onChange={() => setPickedAlbum(pickedAlbum.length === album.length ? [] : album.map((item) => item.id))}
                      />
                      Chọn tất cả
                    </label>
                    <button type="button" disabled={readOnly || !pickedAlbum.length} onClick={() => removeAlbum(pickedAlbum)} className="text-[#e11d2e]">
                      Xóa tất cả
                    </button>
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {album.map((item) => (
                    <div key={item.id} className="rounded-xl border border-zinc-200 p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <input
                          type="checkbox"
                          checked={pickedAlbum.includes(item.id)}
                          disabled={readOnly}
                          onChange={() =>
                            setPickedAlbum((current) =>
                              current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                            )
                          }
                        />
                        <button type="button" disabled={readOnly} onClick={() => removeAlbum([item.id])} className="text-[#e11d2e]" aria-label="Xóa ảnh">
                          🗑
                        </button>
                      </div>
                      <img src={item.src} alt="" className="mb-2 h-28 w-full rounded object-cover" />
                      <input
                        value={item.order}
                        disabled={readOnly}
                        placeholder="Số thứ tự"
                        onChange={(event) => updateAlbum(item.id, { order: event.target.value })}
                        className={`${inputClass} mb-2`}
                      />
                      <input
                        value={item.title}
                        disabled={readOnly}
                        placeholder="Tiêu đề"
                        onChange={(event) => updateAlbum(item.id, { title: event.target.value })}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          ) : null}

          <Section title={isProduct ? "Thông tin Sản phẩm" : "Thông tin"}>
            {isProduct ? (
              <>
                <label className="mb-3 block text-sm">
                  <span className="mb-1 block">Mã sản phẩm:</span>
                  <input value={draft.extra.sku} disabled={readOnly} onChange={(event) => setExtra("sku", event.target.value)} className={inputClass} />
                </label>
                <div className="mb-4 space-y-4">
                  <div>
                    <p className="text-sm">5 loại giá theo tình trạng:</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Hoạt động tốt thì màn hình và thân máy ở các bước sau chọn loại giá, lấy mức xấu hơn. Có vấn đề thì khách tick nhiều phần hư, giá lấy theo lỗi ở loại đó. Không hoạt động luôn là Giá loại 5. Ô tình trạng để trống thì dùng giá của loại tương ứng.
                    </p>
                  </div>
                  {priceColumns.map((grade, gradeIndex) => {
                    const prices = normalizeGradePrices(draft.extra.gradePrices);
                    const screenPrices = normalizeConditionPrices(draft.extra.screenPrices);
                    const bodyPrices = normalizeConditionPrices(draft.extra.bodyPrices);
                    const conditionIndex = gradeIndex === 3 ? 2 : gradeIndex < 2 ? gradeIndex : -1;
                    const levelIndex = columns.indexOf(grade);
                    const note =
                      gradeIndex === 0
                        ? "Hoạt động tốt, màn hình xuất sắc, thân máy xuất sắc."
                        : gradeIndex === 1
                          ? "Màn hình đã qua sử dụng nhẹ, thân máy hao mòn thông thường, hoặc 1 lỗi."
                          : gradeIndex === 2
                            ? "Đúng 2 lỗi. Màn hình và thân máy không xấu hơn mức này."
                            : gradeIndex === 3
                              ? "Màn hình hư hỏng, thân máy hao mòn nặng, hoặc từ 3 lỗi."
                              : "Đồng hồ không hoạt động.";
                    return (
                      <div key={grade} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                        <p className="mb-1 text-sm font-semibold">{grade}</p>
                        <p className="mb-3 text-xs text-zinc-500">{note}</p>
                        {conditionIndex >= 0 ? (
                          <div className="mb-3 grid gap-3 sm:grid-cols-2">
                            <MoneyField
                              label={`Tình trạng màn hình: ${screenOptions[conditionIndex]?.name ?? ""}`}
                              value={screenPrices[conditionIndex]}
                              disabled={readOnly}
                              onChange={(value) => {
                                const next = normalizeConditionPrices(draft.extra.screenPrices);
                                next[conditionIndex] = value;
                                setExtra("screenPrices", next);
                              }}
                            />
                            <MoneyField
                              label={`Thân máy và nút bấm: ${bodyOptions[conditionIndex]?.name ?? ""}`}
                              value={bodyPrices[conditionIndex]}
                              disabled={readOnly}
                              onChange={(value) => {
                                const next = normalizeConditionPrices(draft.extra.bodyPrices);
                                next[conditionIndex] = value;
                                setExtra("bodyPrices", next);
                              }}
                            />
                          </div>
                        ) : null}
                        {gradeIndex < 4 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {issues.slice(0, 4).map((issue, issueIndex) => (
                              <MoneyField
                                key={issue.id}
                                label={issue.name}
                                value={prices[gradeIndex][issueIndex]}
                                disabled={readOnly}
                                onChange={(value) => {
                                  const next = normalizeGradePrices(draft.extra.gradePrices);
                                  next[gradeIndex][issueIndex] = value;
                                  setExtra("gradePrices", next);
                                }}
                              />
                            ))}
                          </div>
                        ) : null}
                        {levelIndex >= 0 ? (
                          <div className="mt-3">
                            <MoneyField
                              label={gradeIndex === 4 ? "Không hoạt động" : "Giá của loại này khi ô tình trạng để trống"}
                              value={draft.cells[levelIndex] ?? ""}
                              disabled={readOnly}
                              onChange={(value) => setCell(levelIndex, value)}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <label className="mb-3 block text-sm">
                  <span className="mb-1 block">Giá mới:</span>
                  <span className="flex items-center gap-2">
                    <input value={draft.extra.newPrice} disabled={readOnly} onChange={(event) => setExtra("newPrice", event.target.value)} className={inputClass} />
                    <span className="text-xs text-zinc-400">VNĐ</span>
                  </span>
                </label>
                <label className="mb-3 block max-w-[180px] text-sm">
                  <span className="mb-1 block">Chiết khấu:</span>
                  <span className="flex items-center gap-2">
                    <input value={discount} readOnly className={inputClass} />
                    <span className="text-xs text-zinc-400">%</span>
                  </span>
                </label>
              </>
            ) : null}
            {columns.map((column, index) => {
              if (skipColumns.has(column) || index === titleIndex || (isProduct && priceColumns.includes(column))) return null;
              if (column === "Danh mục cấp 1") {
                const selected = draft.extra.category || level1Parents.find((item) => item.name === (draft.cells[index] ?? ""))?.code || "";
                return (
                  <label key={column} className="mb-3 block text-sm">
                    <span className="mb-1 block">Danh mục cấp 1</span>
                    <select
                      value={selected}
                      disabled={readOnly}
                      onChange={(event) => {
                        const code = event.target.value;
                        const parent = level1Parents.find((item) => item.code === code);
                        onChange({
                          ...draft,
                          cells: draft.cells.map((cell, cellIndex) => (cellIndex === index ? parent?.name ?? "" : cell)),
                          extra: { ...draft.extra, category: code },
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="">Chọn danh mục cấp 1</option>
                      {level1Parents.map((item) => (
                        <option key={item.key} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-zinc-400">
                      {columns.includes("Giá niêm yết")
                        ? "Cấp 1 là tên thương hiệu. Cấp 2 là sản phẩm này, hiện khi khách chọn máy đổi mới."
                        : "Dòng này hiện ở bước 2 khi khách chọn danh mục cấp 1 tương ứng. Đường dẫn dạng /thu-cu/apple/ hoặc /thu-cu/sam-sung/."}
                    </p>
                  </label>
                );
              }
              return (
                <label key={column} className="mb-3 block text-sm">
                  <span className="mb-1 block">{column}</span>
                  <input
                    value={draft.cells[index] ?? ""}
                    disabled={readOnly}
                    onChange={(event) => setCell(index, event.target.value)}
                    className={inputClass}
                  />
                </label>
              );
            })}
            <label className="mb-3 block max-w-[140px] text-sm">
              <span className="mb-1 block">Số thứ tự</span>
              <input
                value={draft.extra.order}
                disabled={readOnly}
                inputMode="numeric"
                onChange={(event) => setExtra("order", event.target.value)}
                className={inputClass}
              />
            </label>
            {visibleIndex >= 0 ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.cells[visibleIndex] === "✓"}
                  disabled={readOnly}
                  onChange={(event) => setCell(visibleIndex, event.target.checked ? "✓" : "")}
                  className="accent-[#f6c445]"
                />
                Hiển thị
              </label>
            ) : null}
          </Section>

          <Section
            id="noi-dung-seo"
            title="Nội dung SEO"
            action={
              readOnly ? null : (
                <button type="button" onClick={() => setSeoAsk(true)} className="rounded bg-zinc-800 px-3 py-1 text-xs text-white">
                  + Tạo SEO
                </button>
              )
            }
          >
            <CountField label="SEO Title" max={70} value={draft.extra.seoTitle} disabled={readOnly} onChange={(value) => setExtra("seoTitle", value)} />
            <CountField label="SEO Keywords" max={70} value={draft.extra.keywords} disabled={readOnly} onChange={(value) => setExtra("keywords", value)} />
            <CountField label="SEO Description" max={160} value={draft.extra.description} disabled={readOnly} rows={3} onChange={(value) => setExtra("description", value)} />
            <CountField label="Keyword chính" max={100} value={draft.extra.summary} disabled={readOnly} onChange={(value) => setExtra("summary", value)} />
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
              <p className="mb-1 text-xs text-zinc-500">Khi lên top, page này sẽ hiển thị theo dạng mẫu như sau:</p>
              <p className="text-[#2f6fed]">{sample}</p>
              <p className="text-lg text-[#1a0dab]">{draft.extra.seoTitle || name || "Tiêu đề SEO"}</p>
              <p className="text-zinc-600">{draft.extra.description || "Mô tả SEO"}</p>
            </div>
            <div className="mt-3 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={draft.extra.robots === "index"} disabled={readOnly} onChange={() => setExtra("robots", "index")} />
                Index
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={draft.extra.robots === "noindex"} disabled={readOnly} onChange={() => setExtra("robots", "noindex")} />
                No Index
              </label>
            </div>
            <div className="mt-3 grid gap-2">
              <input value={draft.extra.canonical} disabled={readOnly} placeholder="Canonical" onChange={(event) => setExtra("canonical", event.target.value)} className={inputClass} />
              <input value={draft.extra.ogSite} disabled={readOnly} placeholder="Og:site_name" onChange={(event) => setExtra("ogSite", event.target.value)} className={inputClass} />
              <input value={draft.extra.ogType} disabled={readOnly} placeholder="Og:type" onChange={(event) => setExtra("ogType", event.target.value)} className={inputClass} />
              <input value={draft.extra.ogUrl} disabled={readOnly} placeholder="Og:url" onChange={(event) => setExtra("ogUrl", event.target.value)} className={inputClass} />
            </div>
          </Section>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          {columns.map((column, index) => {
            if (index === 0 || index === visibleIndex) return null;
            const choices = column === "Vai trò" ? ["Quản trị", "Nhân viên", "Cộng tác viên"] : column === "Trạng thái" ? ["Hoạt động", "Ngưng"] : null;
            return (
              <label key={column} className="mb-3 block text-sm">
                <span className="mb-1 block">{column === "Vai trò" ? "Phân quyền" : column}</span>
                {choices ? (
                  <select value={draft.cells[index] ?? choices[0]} disabled={readOnly} onChange={(event) => setCell(index, event.target.value)} className={inputClass}>
                    {choices.map((choice) => (
                      <option key={choice}>{choice}</option>
                    ))}
                  </select>
                ) : (
                  <input value={draft.cells[index] ?? ""} disabled={readOnly} onChange={(event) => setCell(index, event.target.value)} className={inputClass} />
                )}
              </label>
            );
          })}
        </div>
      )}

      {seoAsk ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <p className="text-sm">Tạo SEO từ tiêu đề hiện tại?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSeoAsk(false)} className="rounded bg-zinc-200 px-3 py-1.5 text-sm">
                Hủy
              </button>
              <button type="button" onClick={createSeo} className="rounded bg-[#f6c445] px-3 py-1.5 text-sm">
                Tạo SEO
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function Section({ id, title, note, action, children }: { id?: string; title: string; note?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {title} {note ? <span className="text-sm font-normal text-zinc-400">{note}</span> : null}
        </h3>
        {action}
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name);
}

function discountPercent(sale: string, next: string) {
  const amount = Number(sale.replace(/[^\d]/g, "")) || 0;
  const newer = Number(next.replace(/[^\d]/g, "")) || 0;
  if (!amount || newer >= amount) return "0";
  return String(Math.round(((amount - newer) / amount) * 100));
}

const specialChars = ["©", "®", "™", "₫", "•", "–", "—", "…", "«", "»", "“", "”", "‘", "’", "→", "←", "↑", "↓", "✓", "★", "°", "²", "³", "×", "÷", "±"];

function RichText({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(false);
  const [charsOpen, setCharsOpen] = useState(false);
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!source && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value, source]);

  function sync() {
    onChange(ref.current?.innerHTML ?? "");
  }

  function mark(command: string, argument?: string) {
    if (disabled || source) return;
    ref.current?.focus();
    document.execCommand(command, false, argument);
    sync();
  }

  function insertHtml(html: string) {
    if (disabled || source || !html) return;
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  }

  function applyLineHeight(height: string) {
    if (!height || disabled || source) return;
    ref.current?.focus();
    const selected = window.getSelection()?.toString() ?? "";
    if (!selected) return;
    document.execCommand("insertHTML", false, `<span style="line-height:${height}">${selected}</span>`);
    sync();
  }

  function addLink() {
    const href = window.prompt("Đường dẫn liên kết", "https://");
    if (href) mark("createLink", href);
  }

  function addImageUrl() {
    const src = window.prompt("Đường dẫn hình ảnh", "https://");
    if (src) insertHtml(`<img src="${src.replace(/"/g, "")}" alt="" style="max-width:100%;height:auto" />`);
  }

  async function addImageFile(file?: File) {
    if (!file) return;
    try {
      const src = await fileToDataUrl(file, 900);
      if (src.startsWith("data:image/")) insertHtml(`<img src="${src}" alt="" style="max-width:100%;height:auto" />`);
    } catch {
      /* bỏ qua file không đọc được */
    }
  }

  function addVideo() {
    const raw = window.prompt("Đường dẫn YouTube hoặc video", "https://");
    if (!raw) return;
    const match = raw.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/);
    const src = match ? `https://www.youtube.com/embed/${match[1]}` : raw;
    insertHtml(`<p><iframe src="${src.replace(/"/g, "")}" width="560" height="315" style="max-width:100%" allowfullscreen></iframe></p>`);
  }

  function addTable() {
    const rows = Math.min(8, Math.max(1, Number(window.prompt("Số dòng", "2")) || 2));
    const cols = Math.min(8, Math.max(1, Number(window.prompt("Số cột", "2")) || 2));
    const cells = Array.from({ length: cols }, () => "<td>&nbsp;</td>").join("");
    const body = Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");
    insertHtml(`<table style="width:100%;border-collapse:collapse" border="1"><tbody>${body}</tbody></table><p></p>`);
  }

  async function pastePlain() {
    if (disabled || source) return;
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      text = window.prompt("Dán văn bản thuần", "") ?? "";
    }
    if (text) insertHtml(text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char).replace(/\n/g, "<br>"));
  }

  const plain = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(" ").length : 0;
  const paragraphs = (value.match(/<(p|div|h[1-6])\b/gi) || []).length || (plain ? 1 : 0);

  const locked = disabled || source;

  return (
    <div className={`overflow-hidden rounded border border-[#d1d1d1] bg-white ${full ? "fixed inset-4 z-50 flex flex-col shadow-2xl" : ""}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-[#d1d1d1] bg-[#f8f8f8] p-1">
        <EditorButton title="Mã HTML" disabled={disabled} onClick={() => setSource((current) => !current)}>
          Mã HTML
        </EditorButton>
        <EditorButton title={full ? "Thu nhỏ" : "Toàn màn hình"} disabled={disabled} onClick={() => setFull((current) => !current)}>
          {full ? "Thu nhỏ" : "Phóng"}
        </EditorButton>
        <EditorGap />
        <EditorButton title="Hoàn tác" disabled={locked} onClick={() => mark("undo")}>
          ↶
        </EditorButton>
        <EditorButton title="Làm lại" disabled={locked} onClick={() => mark("redo")}>
          ↷
        </EditorButton>
        <EditorButton title="Cắt" disabled={locked} onClick={() => mark("cut")}>
          Cắt
        </EditorButton>
        <EditorButton title="Sao chép" disabled={locked} onClick={() => mark("copy")}>
          Chép
        </EditorButton>
        <EditorButton title="Dán văn bản thuần" disabled={locked} onClick={() => void pastePlain()}>
          Dán
        </EditorButton>
        <EditorButton title="Chọn tất cả" disabled={locked} onClick={() => mark("selectAll")}>
          Chọn hết
        </EditorButton>
        <EditorGap />
        <EditorButton title="Đậm" disabled={locked} onClick={() => mark("bold")} className="font-bold">
          B
        </EditorButton>
        <EditorButton title="Nghiêng" disabled={locked} onClick={() => mark("italic")} className="italic">
          I
        </EditorButton>
        <EditorButton title="Gạch chân" disabled={locked} onClick={() => mark("underline")} className="underline">
          U
        </EditorButton>
        <EditorButton title="Gạch xuyên ngang" disabled={locked} onClick={() => mark("strikeThrough")} className="line-through">
          S
        </EditorButton>
        <EditorButton title="Chỉ số dưới" disabled={locked} onClick={() => mark("subscript")}>
          X₂
        </EditorButton>
        <EditorButton title="Chỉ số trên" disabled={locked} onClick={() => mark("superscript")}>
          X²
        </EditorButton>
        <EditorButton title="Xoá định dạng" disabled={locked} onClick={() => mark("removeFormat")}>
          Tx
        </EditorButton>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b border-[#d1d1d1] bg-[#f8f8f8] px-1 py-1">
        <EditorButton title="Danh sách có thứ tự" disabled={locked} onClick={() => mark("insertOrderedList")}>
          1.
        </EditorButton>
        <EditorButton title="Danh sách không thứ tự" disabled={locked} onClick={() => mark("insertUnorderedList")}>
          •
        </EditorButton>
        <EditorButton title="Dịch ra ngoài" disabled={locked} onClick={() => mark("outdent")}>
          ←
        </EditorButton>
        <EditorButton title="Dịch vào trong" disabled={locked} onClick={() => mark("indent")}>
          →
        </EditorButton>
        <EditorButton title="Trích dẫn" disabled={locked} onClick={() => mark("formatBlock", "blockquote")}>
          “ ”
        </EditorButton>
        <EditorGap />
        <EditorButton title="Canh trái" disabled={locked} onClick={() => mark("justifyLeft")}>
          Trái
        </EditorButton>
        <EditorButton title="Giữa" disabled={locked} onClick={() => mark("justifyCenter")}>
          Giữa
        </EditorButton>
        <EditorButton title="Canh phải" disabled={locked} onClick={() => mark("justifyRight")}>
          Phải
        </EditorButton>
        <EditorButton title="Sắp chữ" disabled={locked} onClick={() => mark("justifyFull")}>
          Đều
        </EditorButton>
        <EditorGap />
        <EditorButton title="Chèn liên kết" disabled={locked} onClick={addLink}>
          Liên kết
        </EditorButton>
        <EditorButton title="Bỏ liên kết" disabled={locked} onClick={() => mark("unlink")}>
          Bỏ link
        </EditorButton>
        <EditorButton title="Chèn hình từ máy" disabled={locked} onClick={() => imageInput.current?.click()}>
          Hình
        </EditorButton>
        <EditorButton title="Chèn hình từ đường dẫn" disabled={locked} onClick={addImageUrl}>
          URL ảnh
        </EditorButton>
        <EditorButton title="Nhúng video" disabled={locked} onClick={addVideo}>
          Video
        </EditorButton>
        <EditorButton title="Chèn bảng" disabled={locked} onClick={addTable}>
          Bảng
        </EditorButton>
        <EditorButton title="Đường phân cách" disabled={locked} onClick={() => mark("insertHorizontalRule")}>
          ―
        </EditorButton>
        <EditorButton title="Ký tự đặc biệt" disabled={locked} onClick={() => setCharsOpen((current) => !current)}>
          Ω
        </EditorButton>
        <input
          ref={imageInput}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
          className="sr-only"
          onChange={(event) => {
            void addImageFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {charsOpen ? (
        <div className="flex flex-wrap gap-1 border-b border-[#d1d1d1] bg-white p-2">
          {specialChars.map((char) => (
            <button
              key={char}
              type="button"
              className="h-7 min-w-7 rounded border border-zinc-200 text-sm hover:bg-zinc-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertHtml(char)}
            >
              {char}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#d1d1d1] bg-[#f8f8f8] px-1 py-1">
        <select aria-label="Định dạng" disabled={locked} defaultValue="" onChange={(event) => { mark("formatBlock", event.target.value); event.target.value = ""; }} className={editorSelect}>
          <option value="" disabled>Định dạng</option>
          <option value="p">Đoạn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
          <option value="h4">Tiêu đề 4</option>
          <option value="h5">Tiêu đề 5</option>
          <option value="h6">Tiêu đề 6</option>
          <option value="pre">Mã</option>
          <option value="blockquote">Trích dẫn</option>
        </select>
        <select aria-label="Phông" disabled={locked} defaultValue="" onChange={(event) => { mark("fontName", event.target.value); event.target.value = ""; }} className={editorSelect}>
          <option value="" disabled>Phông</option>
          <option value="Be Vietnam Pro">Be Vietnam Pro</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Verdana">Verdana</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>
        <select aria-label="Cỡ chữ" disabled={locked} defaultValue="" onChange={(event) => { mark("fontSize", event.target.value); event.target.value = ""; }} className={editorSelect}>
          <option value="" disabled>Cỡ chữ</option>
          <option value="1">8</option>
          <option value="2">10</option>
          <option value="3">12</option>
          <option value="4">14</option>
          <option value="5">18</option>
          <option value="6">24</option>
          <option value="7">36</option>
        </select>
        <select aria-label="Line Height" disabled={locked} defaultValue="" onChange={(event) => { applyLineHeight(event.target.value); event.target.value = ""; }} className={editorSelect}>
          <option value="" disabled>Line Height</option>
          <option value="1">1</option>
          <option value="1.2">1.2</option>
          <option value="1.5">1.5</option>
          <option value="1.8">1.8</option>
          <option value="2">2</option>
        </select>
        <label className="flex items-center gap-1 px-1 text-[11px] text-zinc-600" title="Màu chữ">
          Màu chữ
          <input type="color" aria-label="Màu chữ" disabled={locked} onChange={(event) => mark("foreColor", event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
        </label>
        <label className="flex items-center gap-1 px-1 text-[11px] text-zinc-600" title="Màu nền">
          Màu nền
          <input type="color" aria-label="Màu nền" disabled={locked} defaultValue="#fff3a0" onChange={(event) => mark("hiliteColor", event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
        </label>
      </div>
      {source ? (
        <textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-h-52 w-full flex-1 resize-y p-3 font-mono text-xs outline-none" />
      ) : (
        <div
          ref={ref}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          className="min-h-52 flex-1 bg-white p-3 text-sm outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_td]:border [&_td]:border-zinc-300 [&_td]:p-1 [&_ul]:list-disc [&_ul]:pl-5"
        />
      )}
      <p className="border-t border-[#d1d1d1] bg-[#f8f8f8] px-2 py-1 text-[11px] text-zinc-500">
        Paragraphs: {paragraphs}, Words: {words}, Characters: {plain.length}
      </p>
    </div>
  );
}

const editorSelect = "h-7 rounded border border-zinc-300 bg-white px-1 text-xs text-zinc-700";

function EditorButton({
  title,
  disabled,
  onClick,
  className = "",
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`h-7 min-w-7 rounded border border-transparent px-1.5 text-xs text-zinc-800 hover:border-zinc-300 hover:bg-white disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function EditorGap() {
  return <span className="mx-0.5 h-5 w-px bg-zinc-300" />;
}

function CountField({
  label,
  max,
  value,
  disabled,
  rows,
  onChange,
}: {
  label: string;
  max: number;
  value: string;
  disabled: boolean;
  rows?: number;
  onChange: (value: string) => void;
}) {
  const count = value.length;
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 flex justify-between">
        <span>{label}:</span>
        <span className="text-xs text-zinc-400">
          {count}/{max} ký tự
        </span>
      </span>
      {rows ? (
        <textarea value={value} disabled={disabled} rows={rows} maxLength={max} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      ) : (
        <input value={value} disabled={disabled} maxLength={max} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      )}
    </label>
  );
}
