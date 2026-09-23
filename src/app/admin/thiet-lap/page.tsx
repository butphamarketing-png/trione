"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fileToDataUrl } from "@/lib/demo-media";
import { mapEmbedSrc, readSiteSettings, saveSiteSettings, type SiteSettings } from "@/lib/site-settings";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e2b100] disabled:bg-zinc-50";

export default function SettingsPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [baseline, setBaseline] = useState<SiteSettings | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const current = readSiteSettings();
    setDraft(current);
    setBaseline(current);
  }, []);

  function patch(partial: Partial<SiteSettings>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
    setNotice("");
    setError("");
  }

  function save() {
    if (!draft) return;
    if (!draft.company.trim()) {
      setError("Nhập tên công ty trước khi lưu.");
      setNotice("");
      return;
    }
    const saved = saveSiteSettings({ ...draft, company: draft.company.trim() });
    setDraft(saved);
    setBaseline(saved);
    setError("");
    setNotice("Đã lưu.");
  }

  if (!draft || !baseline) {
    return <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-4 text-sm text-zinc-500">Đang tải...</div>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="submit" className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium">
          Lưu
        </button>
        <button type="button" onClick={save} className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium">
          Lưu tại trang
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(baseline);
            setNotice("");
            setError("");
          }}
          className="rounded-lg bg-[#f6c445] px-5 py-2 text-sm font-medium"
        >
          Làm lại
        </button>
        <button type="button" onClick={() => router.push("/admin")} className="rounded-lg bg-[#f07181] px-5 py-2 text-sm font-medium text-white">
          Thoát
        </button>
      </div>
      {notice ? <p className="mb-3 text-sm text-emerald-600">{notice}</p> : null}
      {error ? <p className="mb-3 text-sm text-[#e11d2e]">{error}</p> : null}

      <div className="space-y-5">
        <Section title="Thông tin chung">
          <Field label="Tên công ty" value={draft.company} onChange={(company) => patch({ company })} />
          <Field label="Slogan" value={draft.slogan} onChange={(slogan) => patch({ slogan })} />
          <Field label="Địa chỉ" value={draft.address} rows={2} onChange={(address) => patch({ address })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Điện thoại" value={draft.phone} onChange={(phone) => patch({ phone })} />
            <Field label="Hotline" value={draft.hotline} onChange={(hotline) => patch({ hotline })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" value={draft.email} onChange={(email) => patch({ email })} />
            <Field label="Website" value={draft.website} onChange={(website) => patch({ website })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Thời gian làm việc" value={draft.hours} onChange={(hours) => patch({ hours })} />
            <Field label="Copyright" value={draft.copyright} onChange={(copyright) => patch({ copyright })} />
          </div>
        </Section>

        <Section title="Hình ảnh">
          <div className="grid gap-4 lg:grid-cols-3">
            <ImageField label="Logo" hint="Width: 300 px · Height: 80 px. Ảnh lớn được nén tự động." value={draft.logo} onChange={(logo) => patch({ logo })} />
            <ImageField label="Favicon" hint="Width: 48 px · Height: 48 px. Ảnh lớn được nén tự động." value={draft.favicon} onChange={(favicon) => patch({ favicon })} />
            <ImageField label="Watermark" hint="Width: 200 px · Height: 200 px. Ảnh lớn được nén tự động." value={draft.watermark} onChange={(watermark) => patch({ watermark })} />
          </div>
        </Section>

        <Section title="Mạng xã hội">
          <Field label="Facebook" value={draft.facebook} onChange={(facebook) => patch({ facebook })} />
          <Field label="Zalo" value={draft.zalo} onChange={(zalo) => patch({ zalo })} />
          <Field label="Youtube" value={draft.youtube} onChange={(youtube) => patch({ youtube })} />
          <Field label="Instagram" value={draft.instagram} onChange={(instagram) => patch({ instagram })} />
          <Field label="Tiktok" value={draft.tiktok} onChange={(tiktok) => patch({ tiktok })} />
        </Section>

        <Section title="Bản đồ">
          <Field label="Mã nhúng Google Maps" value={draft.map} rows={4} mono onChange={(map) => patch({ map })} />
          <p className="mb-3 text-xs text-zinc-400">Dán iframe từ Google Maps. Chỉ nhận đường dẫn maps.google.com.</p>
          {mapEmbedSrc(draft.map) ? (
            <iframe title="Bản đồ cửa hàng" src={mapEmbedSrc(draft.map)} className="h-56 w-full rounded-xl border" loading="lazy" />
          ) : null}
        </Section>

        <Section title="Mã nhúng">
          <Field label="Google Analytics" value={draft.analytics} rows={3} mono onChange={(analytics) => patch({ analytics })} />
          <Field label="Facebook Pixel" value={draft.facebookPixel} rows={4} mono onChange={(facebookPixel) => patch({ facebookPixel })} />
          <p className="mb-3 text-xs text-zinc-400">Dán Pixel ID hoặc đoạn code có fbq(&apos;init&apos;, &apos;1234567890&apos;). Hệ thống chỉ lấy mã pixel, không chạy mã tùy ý.</p>
          <Field label="Google Webmaster Tool" value={draft.webmaster} rows={3} mono onChange={(webmaster) => patch({ webmaster })} />
          <Field label="Head JS" value={draft.headJs} rows={3} mono onChange={(headJs) => patch({ headJs })} />
          <Field label="Body JS" value={draft.bodyJs} rows={3} mono onChange={(bodyJs) => patch({ bodyJs })} />
        </Section>

        <Section
          id="noi-dung-seo"
          title="Nội dung SEO"
          action={
            <button
              type="button"
              onClick={() => {
                const company = draft.company.trim() || "TRIONE.VN";
                const origin = draft.website.replace(/\/$/, "") || "https://trione.vn";
                patch({
                  seoTitle: clip(`${company} | Thu cũ đổi mới đồng hồ`, 70),
                  keywords: clip(`${company}, thu cũ, đổi mới, đồng hồ`, 70),
                  description: clip(
                    `${company}. ${draft.slogan}. Hotline ${draft.hotline}. ${draft.address}.`,
                    160
                  ),
                  summary: clip(draft.slogan || company, 100),
                  canonical: `${origin}/`,
                  ogSite: company,
                  ogType: "website",
                  ogUrl: `${origin}/`,
                  robots: "index",
                });
                setNotice("Đã điền Nội dung SEO từ thông tin công ty.");
                requestAnimationFrame(() => document.getElementById("noi-dung-seo")?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
              className="rounded bg-zinc-800 px-3 py-1 text-xs text-white"
            >
              + Tạo SEO
            </button>
          }
        >
          <CountField label="SEO Title" max={70} value={draft.seoTitle} onChange={(seoTitle) => patch({ seoTitle })} />
          <CountField label="SEO Keywords" max={70} value={draft.keywords} onChange={(keywords) => patch({ keywords })} />
          <CountField label="SEO Description" max={160} value={draft.description} rows={3} onChange={(description) => patch({ description })} />
          <CountField label="Keyword chính" max={100} value={draft.summary} onChange={(summary) => patch({ summary })} />
          <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
            <p className="mb-1 text-xs text-zinc-500">Khi lên top, trang chủ sẽ hiển thị theo dạng mẫu như sau:</p>
            <p className="text-[#2f6fed]">{draft.canonical || draft.website}</p>
            <p className="text-lg text-[#1a0dab]">{draft.seoTitle || draft.company}</p>
            <p className="text-zinc-600">{draft.description || "Mô tả SEO"}</p>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={draft.robots === "index"} onChange={() => patch({ robots: "index" })} />
              Index
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={draft.robots === "noindex"} onChange={() => patch({ robots: "noindex" })} />
              No Index
            </label>
          </div>
          <div className="mt-3 grid gap-2">
            <input value={draft.canonical} placeholder="Canonical" onChange={(event) => patch({ canonical: event.target.value })} className={inputClass} />
            <input value={draft.ogSite} placeholder="Og:site_name" onChange={(event) => patch({ ogSite: event.target.value })} className={inputClass} />
            <input value={draft.ogType} placeholder="Og:type" onChange={(event) => patch({ ogType: event.target.value })} className={inputClass} />
            <input value={draft.ogUrl} placeholder="Og:url" onChange={(event) => patch({ ogUrl: event.target.value })} className={inputClass} />
          </div>
        </Section>
      </div>
    </form>
  );
}

function Section({ id, title, action, children }: { id?: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {action}
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  rows = 0,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
}) {
  const className = mono ? `${inputClass} font-mono text-xs` : inputClass;
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block">{label}</span>
      {rows > 0 ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className={className} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  );
}

function CountField({
  label,
  max,
  value,
  onChange,
  rows = 0,
}: {
  label: string;
  max: number;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="text-xs text-zinc-400">
          {value.length}/{max}
        </span>
      </span>
      {rows > 0 ? (
        <textarea value={value} rows={rows} maxLength={max} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      ) : (
        <input value={value} maxLength={max} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      )}
    </label>
  );
}

function ImageField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Chỉ nhận file ảnh.");
      return;
    }
    setBusy(true);
    setFileError("");
    try {
      onChange(await fileToDataUrl(file, 600));
    } catch {
      setFileError("Không đọc được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm">{label}</p>
      <div
        className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          pick(event.dataTransfer.files?.[0]);
        }}
      >
        {value ? <img src={value} alt="" className="mx-auto mb-3 h-20 w-20 rounded object-contain" /> : null}
        <p className="text-sm text-zinc-500">Kéo và thả hình vào đây</p>
        <p className="my-1 text-xs text-zinc-400">hoặc</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="rounded-lg bg-[#3dbe7a] px-3 py-1.5 text-sm text-white disabled:opacity-60"
        >
          {busy ? "Đang xử lý..." : "Chọn hình"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
          className="sr-only"
          onChange={(event) => {
            pick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-zinc-400">{hint}</p>
        {fileError ? <p className="mt-1 text-xs text-[#e11d2e]">{fileError}</p> : null}
      </div>
      {value ? (
        <button type="button" onClick={() => onChange("")} className="mt-2 text-xs text-[#e11d2e]">
          Xóa ảnh
        </button>
      ) : null}
    </div>
  );
}

function clip(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}
