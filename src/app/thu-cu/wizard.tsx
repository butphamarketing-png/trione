"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { StoreFooter, WizardHeader, Stepper, CheckBox } from "@/components/store-footer";
import { LineThumb, WatchFace, GarminThumb, ModelThumb } from "@/components/watch-face";
import { BrandMark } from "@/components/brand-mark";
import {
  bodyOptions,
  brands,
  garminNew,
  issues,
  lines,
  models,
  photoSlots,
  screenOptions,
  seriesFilters,
} from "@/data/catalog";
import { resolveGrade, vnd } from "@/lib/pricing";
import { formatCreatedAt, makeRequestCode, saveTradeRequest } from "@/lib/demo-requests";

type FunctionStatus = "ok" | "issues" | "dead";

export function TradeInWizard() {
  const [step, setStep] = useState(1);
  const [brandId, setBrandId] = useState("apple");
  const [otherBrand, setOtherBrand] = useState("");
  const [lineId, setLineId] = useState("ultra");
  const [modelId, setModelId] = useState("ultra2");
  const [serial, setSerial] = useState("");
  const [fn, setFn] = useState<FunctionStatus>("ok");
  const [issueIds, setIssueIds] = useState<string[]>(["hr"]);
  const [issueNote, setIssueNote] = useState("");
  const [screen, setScreen] = useState("excellent");
  const [body, setBody] = useState("excellent");
  const [battery, setBattery] = useState("good");
  const [strap, setStrap] = useState("good");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [garminId, setGarminId] = useState("fenix8");
  const [series, setSeries] = useState("TẤT CẢ");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modelQ, setModelQ] = useState("");
  const [garminQ, setGarminQ] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [requestCode, setRequestCode] = useState("");

  const brand = brands.find((b) => b.id === brandId);
  const brandLines = lines.filter((l) => l.brandId === brandId);
  const line = lines.find((l) => l.id === lineId);
  const model = models.find((m) => m.id === modelId);
  const garmin = garminNew.find((g) => g.id === garminId) ?? garminNew[0];
  const deviceLabel =
    brandId === "other"
      ? otherBrand.trim() || "Thương hiệu khác"
      : model
        ? `${model.name}${model.specs ? ` · ${model.specs.split(" · ")[0]}` : ""}`
        : "";
  const grade = resolveGrade({
    functionStatus: fn,
    issueIds,
    screen,
    body,
    battery,
    strap,
  });
  const tradeIn = model?.prices[grade] ?? 0;
  const due = Math.max(0, garmin.listPrice - tradeIn);
  const photoCount = photoSlots.filter((p) => photos[p.id]).length;
  const visibleGarmin = garminNew.filter((g) => {
    const bySeries = series === "TẤT CẢ" || g.series === series;
    const byQ = !garminQ.trim() || `${g.name} ${g.specs} ${g.series}`.toLowerCase().includes(garminQ.toLowerCase());
    return bySeries && byQ;
  });
  const visibleLines = brandLines;
  const visibleModels = models.filter((m) => {
    if (m.lineId !== lineId) return false;
    return !modelQ.trim() || `${m.name} ${m.specs} ${m.blurb}`.toLowerCase().includes(modelQ.toLowerCase());
  });

  const displayStep = step === 52 ? 5 : step >= 10 ? 9 : step;
  const canNext = useMemo(() => {
    if (step === 1) return brandId === "other" ? otherBrand.trim().length >= 2 : !!brandId;
    if (step === 2) return brandId === "other" || !!lineId;
    if (step === 3) return brandId === "other" || !!modelId;
    if (step === 4) return true;
    if (step === 5) return !!fn;
    if (step === 52) return issueIds.length > 0;
    if (step === 6) return !!screen;
    if (step === 7) return !!body;
    if (step === 8) return true;
    if (step === 9) return !!garminId;
    if (step === 10) return agreed;
    return true;
  }, [step, brandId, otherBrand, lineId, modelId, serial, fn, issueIds, screen, body, battery, strap, garminId, agreed]);

  function next() {
    if (step === 1 && brandId === "other") {
      setStep(4);
      return;
    }
    if ((step === 2 || step === 3) && brandId === "other") {
      setStep(4);
      return;
    }
    if (step === 5 && fn === "issues") {
      setStep(52);
      return;
    }
    if (step === 52) {
      setStep(6);
      return;
    }
    if (step === 9) {
      setRequestCode(makeRequestCode());
      setStep(10);
      return;
    }
    if (step === 10 && agreed) {
      const code = requestCode || makeRequestCode();
      const now = new Date();
      const tags = [
        fn === "ok" ? "CHỨC NĂNG TỐT" : fn === "dead" ? "KHÔNG HOẠT ĐỘNG" : "CÓ VẤN ĐỀ",
        `MÀN HÌNH ${screen === "excellent" ? "XUẤT SẮC" : screen === "light" ? "NHẸ" : "HƯ HỎNG"}`,
        `THÂN MÁY ${body === "excellent" ? "XUẤT SẮC" : body === "light" ? "MÒN" : "NẶNG"}`,
      ];
      saveTradeRequest({
        id: code,
        username: "khach.trione",
        name: "Khách TRIONE.VN",
        createdAt: formatCreatedAt(now),
        updatedAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        address: "300/41/13A Nguyễn Thái Sơn, Phường Hạnh Thông, TP. Hồ Chí Minh",
        brand: brand?.name ?? otherBrand ?? "Khác",
        oldDevice:
          brandId === "other"
            ? `${otherBrand.trim()} · sẽ thẩm định tại cửa hàng`
            : `${model?.name ?? ""} · ${model?.specs ?? ""}`,
        imeiOld: serial.trim() || "Chưa nhập",
        grade: `loại ${grade}`,
        tags,
        photoCount,
        newDevice: garmin.name,
        newSpecs: garmin.specs,
        newPrice: garmin.listPrice,
        tradeIn,
        note: issueNote,
        status: "cho-tham-dinh",
        source: "Tạo bởi khách hàng TRIONE.VN",
      });
      setRequestCode(code);
      setSubmitted(true);
      return;
    }
    setStep((s) => Math.min(10, s + 1));
  }
  function back() {
    if (step === 4 && brandId === "other") {
      setStep(1);
      return;
    }
    if (step === 52) {
      setStep(5);
      return;
    }
    if (step === 6 && fn === "issues") {
      setStep(52);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  function assignFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setPhotos((prev) => {
      const next = { ...prev };
      const empty = photoSlots.filter((p) => !next[p.id]);
      files.forEach((file, i) => {
        const slot = empty[i];
        if (!slot) return;
        if (next[slot.id]?.startsWith("blob:")) URL.revokeObjectURL(next[slot.id]);
        next[slot.id] = URL.createObjectURL(file);
      });
      return next;
    });
  }

  function setSlotPhoto(id: string, file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotos((prev) => {
      if (prev[id]?.startsWith("blob:")) URL.revokeObjectURL(prev[id]);
      return { ...prev, [id]: URL.createObjectURL(file) };
    });
  }

  function clearSlotPhoto(id: string) {
    setPhotos((prev) => {
      if (prev[id]?.startsWith("blob:")) URL.revokeObjectURL(prev[id]);
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f7f7f8]">
        <div className="pointer-events-none absolute top-40 right-[-120px] h-[520px] w-[520px] rounded-full border-[40px] border-rose-100/70" />
        <WizardHeader />
        <div className="relative mx-auto w-full max-w-5xl px-6 py-8">
          <Stepper current={9} doneAll />
          <section>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="border-l-4 border-[#e11d2e] pl-4">
                <h1 className="text-[28px] leading-tight font-bold">Yêu cầu đã gửi thành công</h1>
                <p className="mt-1 text-zinc-500">Nhân viên TRIONE.VN sẽ liên hệ để thẩm định trong giờ làm việc.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                ✓ ĐÃ HOÀN TẤT 9 BƯỚC
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-5">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-emerald-800">GIÁ THU CŨ DỰ KIẾN · HIỆU LỰC 07 NGÀY</p>
                <p className="text-4xl font-bold text-emerald-800">{vnd(tradeIn)}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {deviceLabel} → {garmin.name} · thanh toán thêm {vnd(due)}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 text-sm">
                <p className="text-[11px] text-zinc-400">MÃ YÊU CẦU</p>
                <p className="font-bold">{requestCode}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="rounded-xl bg-[#e11d2e] px-5 py-3 font-semibold text-white" href={`/nhan-vien/yeu-cau/${requestCode}`}>
                Xem cổng nhân viên
              </a>
              <a className="rounded-xl border bg-white px-5 py-3" href="/thu-cu">
                Tạo yêu cầu khác
              </a>
            </div>
          </section>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8] relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-120px] top-40 h-[520px] w-[520px] rounded-full border-[40px] border-rose-100/70" />
      <WizardHeader />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-8">
        <Stepper current={displayStep} doneAll={step === 10} />

        {step === 1 && (
          <Section
            title="Chọn thương hiệu đồng hồ"
            sub="Đồng hồ bạn muốn thu cũ thuộc thương hiệu nào?"
            chip={<span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-[#e11d2e]">● Chọn 01 thương hiệu</span>}
          >
            <div className="grid sm:grid-cols-3 gap-x-8 gap-y-6">
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBrandId(b.id);
                    const first = lines.find((l) => l.brandId === b.id);
                    if (first) {
                      setLineId(first.id);
                      const m = models.find((x) => x.lineId === first.id);
                      if (m) setModelId(m.id);
                    }
                  }}
                  className="flex items-center gap-3 text-left"
                >
                  <BrandMark id={b.id} />
                  <span className="flex-1">
                    <span className="block font-semibold">{b.name}</span>
                    <span className="text-sm text-zinc-500">{b.line}</span>
                  </span>
                  <CheckBox on={brandId === b.id} />
                </button>
              ))}
              <div className="flex items-start gap-3">
                <BrandMark id="other" />
                <div className="flex-1">
                  <p className="font-semibold">Thương hiệu khác</p>
                  <input
                    value={otherBrand}
                    onChange={(e) => {
                      setOtherBrand(e.target.value);
                      setBrandId("other");
                      setLineId("");
                      setModelId("");
                    }}
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Nhập tên thương hiệu..."
                  />
                </div>
                <CheckBox on={brandId === "other"} />
              </div>
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section
            title={`Đây là dòng ${brand?.name ?? ""} nào?`}
            sub="Chọn dòng sản phẩm được hiển thị trên đồng hồ hoặc trong ứng dụng kết nối."
            chip={
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm">
                {brandId === "apple" ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1-.1.8-2.3 1.7-3.4-.7-.3-2-1.2-2-2.1zM14.8 6.4c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2.1-.6 2.7-1.4z" />
                  </svg>
                ) : null}
                Thương hiệu: {brand?.name}
              </span>
            }
          >
            <div className="grid md:grid-cols-2 gap-4">
              {visibleLines.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setLineId(l.id);
                    const m = models.find((x) => x.lineId === l.id);
                    if (m) setModelId(m.id);
                  }}
                  className={`flex gap-4 rounded-2xl border bg-white p-4 text-left ${
                    lineId === l.id ? "border-[#e11d2e] shadow-sm" : "border-transparent"
                  }`}
                >
                  <LineThumb kind={l.thumb} />
                  <span className="flex-1">
                    <span className="block font-semibold text-lg">{l.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{l.blurb}</span>
                    {lineId === l.id && (
                      <span className="mt-3 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs text-trione">
                        ĐÃ CHỌN
                      </span>
                    )}
                  </span>
                  {lineId === l.id ? <CheckBox on /> : <span className="self-center text-zinc-300">→</span>}
                </button>
              ))}
              <div className="flex items-center gap-4 rounded-2xl bg-zinc-900 p-6 text-white">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e11d2e] text-xl font-bold">
                  ?
                </span>
                <div className="flex-1">
                  <p className="font-semibold">Không chắc dòng sản phẩm?</p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Kiểm tra tên mẫu ở mặt lưng đồng hồ hoặc trong ứng dụng Watch trên iPhone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="mt-3 rounded-lg bg-white px-4 py-2 text-sm text-black"
                  >
                    Xem hướng dẫn nhận diện
                  </button>
                </div>
                <span className="text-zinc-500">→</span>
              </div>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section
            title={`Đây là mẫu ${line?.name ?? "sản phẩm"} nào?`}
            sub="Chọn đúng mẫu và kích thước phù hợp với đồng hồ của bạn."
            chip={
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm">
                <AppleMini />
                {brand?.name} / {line?.name}
              </span>
            }
          >
            <div className="mb-2 flex flex-wrap gap-3">
              <div className="relative min-w-[240px] flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
                <input
                  value={modelQ}
                  onChange={(e) => setModelQ(e.target.value)}
                  className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm"
                  placeholder="Tìm theo tên mẫu hoặc kích thước..."
                />
              </div>
              <div className="flex min-w-[160px] items-center justify-between rounded-xl border bg-white px-4 py-2 text-xs text-zinc-500">
                <div>
                  <p className="text-[10px] tracking-wide">▽ BỘ LỌC MẪU</p>
                  <p className="font-semibold text-zinc-800">Tất cả thế hệ</p>
                </div>
                <span>▾</span>
              </div>
            </div>
            <p className="mb-3 text-xs text-zinc-400">
              Tìm thấy {visibleModels.length} mẫu {line?.name}
            </p>
            <div className="space-y-3">
              {visibleModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModelId(m.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left ${
                    modelId === m.id ? "border-[#e11d2e] bg-rose-50/40" : "border-zinc-100"
                  }`}
                >
                  <div className="h-[88px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-[#f4f4f5]">
                    <ModelThumb id={m.id} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{m.name}</p>
                    <p className="text-sm text-zinc-500">{m.specs}</p>
                    <p className="text-sm text-zinc-500">{m.blurb}</p>
                  </div>
                  {modelId === m.id ? (
                    <>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-trione">ĐÃ CHỌN</span>
                      <CheckBox on />
                    </>
                  ) : (
                    <CheckBox on={false} />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              i &nbsp; Chưa chắc chắn? Tên mẫu thường nằm trong Cài đặt · Cài đặt chung · Giới thiệu.
            </p>
          </Section>
        )}

        {step === 4 && (
          <Section
            title="Nhập IMEI hoặc số sê-ri"
            sub="Không bắt buộc. Có thể bỏ qua và bổ sung khi thẩm định tại cửa hàng."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <div className="rounded-2xl bg-white p-6">
              <p className="text-xs font-semibold tracking-wide text-zinc-500">
                IMEI HOẶC SỐ SÊ-RI <span className="font-medium text-zinc-400">· KHÔNG BẮT BUỘC</span>
              </p>
              <p className="mb-2 text-xs text-zinc-400">Nếu có mã trên thiết bị hoặc hộp sản phẩm, nhập để nhân viên đối chiếu nhanh hơn.</p>
              <div className="relative">
                <input
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none"
                  placeholder="Ví dụ: L0XXXXXXXXXX hoặc 35XXXXXXXXXXXX"
                  maxLength={18}
                />
                <span className="absolute right-3 top-3 text-xs text-zinc-400">{serial.length}/18</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div className="flex gap-3 rounded-xl bg-zinc-50 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-lg">⌚</span>
                  <div>
                    <p className="font-semibold">Tìm trên Apple Watch</p>
                    <p className="text-zinc-500">Cài đặt · Cài đặt chung · Giới thiệu</p>
                    <p className="text-xs text-zinc-400">Xem mục “Số sê-ri” hoặc “IMEI”.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-zinc-50 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-lg">▭</span>
                  <div>
                    <p className="font-semibold">Tìm trên hộp sản phẩm</p>
                    <p className="text-zinc-500">Kiểm tra tem thông tin ở mặt sau hộp.</p>
                    <p className="text-xs text-zinc-400">Mã thường nằm cạnh mã vạch của thiết bị.</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-400">🔒 Mã chỉ được dùng để xác minh thiết bị và hiển thị trên báo giá của bạn.</p>
          </Section>
        )}

        {step === 5 && (
          <Section
            title="Đồng hồ có hoạt động bình thường không?"
            sub="Kiểm tra nguồn, sạc, cảm ứng, GPS và khả năng đồng bộ với ứng dụng."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <div className="space-y-3">
              {(
                [
                  ["ok", "Có, mọi chức năng đều hoạt động", "Đồng hồ mở nguồn, sạc, cảm ứng, GPS, nút bấm và kết nối ứng dụng bình thường.", "HOẠT ĐỘNG TỐT", "✓", "bg-emerald-100 text-emerald-700", "good"],
                  ["issues", "Có, nhưng đồng hồ đang gặp một số vấn đề", "Thiết bị vẫn mở nguồn nhưng một hoặc nhiều chức năng hoạt động không ổn định.", "Sẽ được chọn chi tiết chức năng đang gặp lỗi.", "⇄", "bg-amber-100 text-amber-700", "warn"],
                  ["dead", "Không, đồng hồ không hoạt động bình thường", "Không mở nguồn, không sạc, không đồng bộ hoặc không sử dụng được GPS.", "Thiết bị cần được kiểm tra tình trạng chi tiết.", "!", "bg-rose-100 text-rose-600", "bad"],
                ] as const
              ).map(([id, title, hint, tag, mark, icon, tone]) => (
                <button
                  key={id}
                  onClick={() => setFn(id)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left ${
                    fn === id
                      ? tone === "good"
                        ? "border-[#e11d2e] bg-emerald-50/60"
                        : "border-[#e11d2e] bg-white"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl text-xl ${icon}`}>{mark}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm text-zinc-500 mt-1">{hint}</span>
                    <span className={`mt-2 inline-block text-xs font-medium ${tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-700" : "text-rose-600"}`}>
                      {tag}
                    </span>
                  </span>
                  <CheckBox on={fn === id} />
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 52 && (
          <Section
            title="Đồng hồ đang gặp vấn đề gì?"
            sub="Có thể chọn nhiều mục. Hãy chọn tất cả vấn đề đã kiểm tra được trên thiết bị."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>
                <span className="font-semibold">TÌNH TRẠNG ĐÃ CHỌN</span>
                <span className="mt-0.5 block text-xs">Có, nhưng đồng hồ đang gặp một số vấn đề</span>
              </span>
              <span className="text-[11px] font-semibold">CHỌN NHIỀU</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {issues.map((i) => {
                const on = issueIds.includes(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() =>
                      setIssueIds((prev) =>
                        on ? prev.filter((x) => x !== i.id) : [...prev, i.id]
                      )
                    }
                    className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-left ${
                      on ? "border-[#e11d2e] bg-rose-50/50" : "border-zinc-100"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
                      <IssueGlyph id={i.id} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{i.name}</span>
                      <span className="block text-sm text-zinc-500">{i.hint}</span>
                    </span>
                    <CheckBox on={on} />
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] font-semibold tracking-wide text-zinc-400">MÔ TẢ THÊM (KHÔNG BẮT BUỘC)</p>
            <textarea
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              className="mt-1 w-full rounded-xl border p-3 text-sm"
              placeholder="Nhập thêm biểu hiện lỗi hoặc thông tin cần lưu ý..."
            />
          </Section>
        )}

        {step === 6 && (
          <Section
            title="Tình trạng màn hình như thế nào?"
            sub="Lau sạch bụi và dấu vân tay, sau đó kiểm tra mặt kính dưới ánh sáng rõ."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <OptionList kind="screen" options={screenOptions} value={screen} onChange={setScreen} />
          </Section>
        )}

        {step === 7 && (
          <Section
            title="Thân máy và các nút bấm như thế nào?"
            sub="Kiểm tra viền, mặt lưng, các nút bấm và khu vực cảm biến của đồng hồ."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <OptionList kind="body" options={bodyOptions} value={body} onChange={setBody} />
          </Section>
        )}

        {step === 8 && (
          <Section
            title="Chụp hình ảnh thiết bị"
            sub="Không bắt buộc. Có thể tải từ máy, chụp bằng điện thoại, hoặc bỏ qua."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) assignFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) assignFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white"
              >
                + TẢI ẢNH TỪ MÁY
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="rounded-lg border bg-white px-4 py-2.5 text-sm"
              >
                📱 CHỤP TRỰC TIẾP TRÊN ĐIỆN THOẠI
              </button>
              <span className="text-xs text-zinc-400">
                JPG, PNG · Tối đa 10 MB/ảnh · Không bắt buộc
                <span className="mt-0.5 block">Ảnh rõ nét, đủ sáng và không bị che khuất.</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {photoSlots.slice(0, 4).map((p) => (
                <PhotoCard
                  key={p.id}
                  p={p}
                  src={photos[p.id]}
                  onFile={(file) => setSlotPhoto(p.id, file)}
                  onClear={() => clearSlotPhoto(p.id)}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {photoSlots.slice(4).map((p) => (
                <PhotoCard
                  key={p.id}
                  p={p}
                  src={photos[p.id]}
                  onFile={(file) => setSlotPhoto(p.id, file)}
                  onClear={() => clearSlotPhoto(p.id)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-400">Ảnh chỉ được dùng để kiểm tra và xác nhận giao dịch thu cũ.</p>
          </Section>
        )}

        {step === 9 && (
          <Section
            title="Chọn sản phẩm Garmin Đổi Mới"
            sub="Tìm sản phẩm Garmin phù hợp và xem chi phí thanh toán sau khi trừ giá thu cũ."
            chip={
              <div className="flex items-center gap-2">
                <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
                  <p className="text-[10px] tracking-wide text-zinc-400">GIÁ THU CŨ DỰ KIẾN</p>
                  <p className="font-bold text-[#e11d2e]">{vnd(tradeIn)}</p>
                </div>
                <div className="max-w-[150px] rounded-2xl bg-white px-4 py-2 text-xs text-zinc-600 shadow-sm">
                  {deviceLabel}
                </div>
              </div>
            }
          >
            <div className="grid lg:grid-cols-[1fr_280px] gap-6">
              <div>
                <div className="relative mb-3">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
                  <input
                    value={garminQ}
                    onChange={(e) => setGarminQ(e.target.value)}
                    className="w-full rounded-xl border bg-white px-10 py-3 text-sm"
                    placeholder="Tìm theo tên, dòng máy hoặc kích thước sản phẩm..."
                  />
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {seriesFilters.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeries(s)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        series === s ? "bg-[#e11d2e] text-white" : "bg-white border"
                      }`}
                    >
                      {s === "TẤT CẢ" ? "TẤT CẢ" : s}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-zinc-400">{visibleGarmin.length} sản phẩm</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {visibleGarmin.map((g) => {
                    const extra = g.listPrice - tradeIn;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGarminId(g.id)}
                        className={`flex items-center gap-3 rounded-2xl border bg-white p-3 text-left ${
                          garminId === g.id ? "border-[#e11d2e]" : "border-zinc-100"
                        }`}
                      >
                        <div className="grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3f3f4]">
                          <GarminThumb id={g.id} face={g.face} strap={g.strap} time={g.time} />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] tracking-wide text-zinc-400">{g.series} SERIES</span>
                          <span className="block font-semibold">{g.name}</span>
                          <span className="block text-xs text-zinc-500">{g.specs}</span>
                          <span className="mt-1 block text-xs text-zinc-500">Giá sản phẩm {vnd(g.listPrice)}</span>
                          <span className={`block text-sm font-semibold ${extra <= 0 ? "text-emerald-700" : "text-[#e11d2e]"}`}>
                            {extra <= 0 ? "Không cần trả thêm" : `Cần trả thêm ${vnd(extra)}`}
                          </span>
                        </span>
                        {garminId === g.id && <CheckBox on />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-semibold">Tạm tính đổi mới</p>
                <div className="mt-3 flex justify-between text-sm">
                    <span>
                    <span className="block text-[10px] text-zinc-400">THIẾT BỊ THU CŨ</span>
                    {deviceLabel}
                  </span>
                  <span className="font-semibold text-emerald-700">− {vnd(tradeIn)}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e11d2e] p-2">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg bg-[#f3f3f4]">
                    <GarminThumb id={garmin.id} face={garmin.face} strap={garmin.strap} time={garmin.time} size={56} />
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="text-[10px] text-[#e11d2e]">ĐÃ CHỌN</p>
                    <p className="font-semibold leading-tight">{garmin.name}</p>
                    <p className="text-xs text-zinc-500">{garmin.specs}</p>
                    <p className="text-xs">{vnd(garmin.listPrice)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span>Giá sản phẩm mới</span>
                    <span>{vnd(garmin.listPrice)}</span>
                  </p>
                  <p className="flex justify-between text-emerald-700">
                    <span>Khấu trừ máy cũ</span>
                    <span>− {vnd(tradeIn)}</span>
                  </p>
                </div>
                <p className="mt-3 rounded-xl bg-rose-50 p-3">
                  <span className="block text-[11px] text-zinc-500">CHI PHÍ ĐỔI MỚI DỰ KIẾN</span>
                  <span className="text-xl font-bold text-[#e11d2e]">{vnd(due)}</span>
                </p>
                <button
                  type="button"
                  onClick={next}
                  disabled={!garminId}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e11d2e] px-4 py-3 text-sm font-bold text-white disabled:bg-zinc-300"
                >
                  XEM BÁO GIÁ ĐỔI MỚI <span>›</span>
                </button>
              </aside>
            </div>
            <p className="mt-4 text-xs text-zinc-400">Giá hiển thị là mức dự kiến và sẽ được xác nhận tại cửa hàng.</p>
          </Section>
        )}

        {step === 10 && (
          <Section
            title="Xác nhận thông tin đổi mới"
            sub="Kiểm tra lại thông tin sản phẩm và chi phí trước khi gửi yêu cầu đến TRIONE.VN."
            chip={
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                ✓ ĐÃ HOÀN TẤT 9 BƯỚC
              </span>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-xl text-white">✓</span>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-emerald-800">GIÁ THU CŨ DỰ KIẾN</p>
                  <p className="text-4xl font-bold text-emerald-800">{vnd(tradeIn)}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Mức giá được xác nhận sau khi kiểm tra thiết bị thực tế tại cửa hàng.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 text-sm">
                <p className="text-[11px] text-zinc-400">MÃ YÊU CẦU</p>
                <p className="font-bold">{requestCode || "Đang tạo mã…"}</p>
                <p className="text-xs text-zinc-500">
                  Hiệu lực báo giá dự kiến
                  <br />
                  <b>07 ngày</b> kể từ khi gửi
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">SẢN PHẨM THU CŨ</span>
                  <button type="button" onClick={() => setStep(brandId === "other" ? 1 : 3)} className="text-[#e11d2e]">
                    Chỉnh sửa
                  </button>
                </div>
                <p className="mt-2 text-xl font-bold">{deviceLabel}</p>
                <p className="text-sm text-zinc-500">{brandId === "other" ? "Giá thu cũ sẽ được thẩm định tại cửa hàng" : model?.specs}</p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid h-24 w-24 place-items-center rounded-xl bg-[#f3f3f4]">
                    <WatchFace face="#222" strap="#c45a28" time="10:09" size={72} />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400">TÌNH TRẠNG ĐÃ KHAI BÁO</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        {fn === "ok" ? "CHỨC NĂNG TỐT" : fn === "dead" ? "KHÔNG HOẠT ĐỘNG" : "CÓ VẤN ĐỀ"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        MÀN HÌNH {screen === "excellent" ? "XUẤT SẮC" : screen === "light" ? "NHẸ" : "HƯ HỎNG"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                        THÂN MÁY {body === "excellent" ? "XUẤT SẮC" : body === "light" ? "MÒN" : "NẶNG"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Serial: {serial.trim() || "Chưa nhập"} · {photoCount} ảnh đã tải lên
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white">
                  <span>Giá trị khấu trừ dự kiến</span>
                  <span className="font-semibold">{vnd(tradeIn)}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">SẢN PHẨM GARMIN ĐỔI MỚI</span>
                  <button type="button" onClick={() => setStep(9)} className="text-[#e11d2e]">
                    Đổi mẫu khác
                  </button>
                </div>
                <div className="mt-3 flex gap-3">
                  <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-xl bg-[#f3f3f4]">
                    <GarminThumb id={garmin.id} face={garmin.face} strap={garmin.strap} time={garmin.time} size={88} />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-[10px] text-zinc-400">{garmin.series} SERIES</p>
                    <p className="text-lg font-bold">{garmin.name}</p>
                    <p className="text-zinc-500">{garmin.specs}</p>
                    <p className="mt-3 flex justify-between">
                      <span>Giá sản phẩm</span>
                      <span className="font-semibold">{vnd(garmin.listPrice)}</span>
                    </p>
                    <p className="flex justify-between text-zinc-500">
                      <span>Bảo hành chính hãng</span>
                      <span>24 tháng</span>
                    </p>
                    <p className="mt-2 flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-xs text-[#e11d2e]">
                      Đã chọn làm sản phẩm đổi mới <CheckBox on />
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-5 py-4">
              <span className="text-sm">
                Khách hàng cần thanh toán sau khi khấu trừ
                <span className="mt-1 block text-xs text-zinc-500">
                  {vnd(garmin.listPrice)} − {vnd(tradeIn)}
                </span>
              </span>
              <span className="text-2xl font-bold">{vnd(due)}</span>
            </div>
          </Section>
        )}

        <div className="mt-10 flex items-center justify-between border-t border-zinc-100 pt-6" suppressHydrationWarning>
          <button
            onClick={back}
            disabled={step === 1}
            className="rounded-xl border bg-white px-6 py-3 text-zinc-700 disabled:border-transparent disabled:bg-transparent disabled:text-zinc-300"
          >
            {step === 1 ? "Quay lại" : "← Quay lại"}
          </button>
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-500 hidden sm:block">
              {step === 1 && (
                <>
                  Đã chọn: <b className="text-[#e11d2e]">{brand?.name ?? otherBrand}</b>
                </>
              )}
              {step === 2 && (
                <>
                  Đã chọn: <b className="text-[#e11d2e]">{line?.name}</b>
                </>
              )}
              {step === 3 && (
                <>
                  Đã chọn: <b className="text-[#e11d2e]">{model?.name}</b>
                </>
              )}
              {step === 4 && (serial.trim() ? serial : "Không bắt buộc — bấm Bỏ qua để tiếp tục")}
              {step === 5 && (
                <>
                  Đã chọn:{" "}
                  <b className="text-emerald-700">
                    {fn === "ok" ? "Hoạt động tốt" : fn === "issues" ? "Có vấn đề" : "Không hoạt động"}
                  </b>
                </>
              )}
              {step === 6 && (
                <>
                  Đã chọn: <b className="text-emerald-700">{screenOptions.find((o) => o.id === screen)?.name}</b>
                </>
              )}
              {step === 7 && (
                <>
                  Đã chọn: <b className="text-emerald-700">{bodyOptions.find((o) => o.id === body)?.name}</b>
                </>
              )}
              {step === 8 && (
                <>
                  {photoCount ? `${photoCount} ảnh đã thêm · không bắt buộc` : "Không bắt buộc — bấm Bỏ qua để tiếp tục"}
                </>
              )}
              {step === 52 && (
                <>
                  Đã chọn: <b className="text-[#e11d2e]">{issueIds.length} vấn đề</b>
                </>
              )}
              {step === 9 && `Đã chọn 1 sản phẩm`}
              {step === 10 && (
                <label className="flex items-center gap-2">
                  <CheckBox on={agreed} />
                  <button type="button" onClick={() => setAgreed((v) => !v)}>
                    Tôi xác nhận thông tin trên là chính xác
                  </button>
                </label>
              )}
            </p>
            {step !== 9 && (
              <div className="text-right">
                <button
                  onClick={next}
                  disabled={!canNext}
                  className="rounded-xl bg-[#e11d2e] px-8 py-3 font-semibold text-white disabled:bg-zinc-300"
                >
                  {step === 10
                    ? "GỬI YÊU CẦU ĐỔI MỚI  ›"
                    : step === 52
                      ? "Xác nhận  ›"
                      : (step === 4 && !serial.trim()) || (step === 8 && photoCount === 0)
                        ? "Bỏ qua  ›"
                        : "Tiếp tục  ›"}
                </button>
                {step === 10 && (
                  <p className="mt-2 max-w-[240px] text-[11px] leading-4 text-zinc-400">
                    Bằng việc gửi yêu cầu, khách hàng đồng ý với chính sách thu cũ của TRIONE.VN.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <StoreFooter />
      {guideOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setGuideOpen(false)}>
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold">Nhận diện dòng Apple Watch</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>Ultra: vỏ titanium, nút Action cam, mặt 49 mm.</li>
              <li>Series: Digital Crown, các cỡ 41/45/42/46 mm tùy thế hệ.</li>
              <li>SE: không có Always-On, giá thành thấp hơn Series cùng năm.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-400">Cài đặt · Cài đặt chung · Giới thiệu trên đồng hồ hoặc iPhone.</p>
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="mt-4 rounded-lg bg-[#e11d2e] px-4 py-2 text-sm font-semibold text-white"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  sub,
  children,
  chip,
}: {
  title: string;
  sub: string;
  children: ReactNode;
  chip?: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="border-l-4 border-[#e11d2e] pl-4">
          <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
          <p className="text-zinc-500 mt-1">{sub}</p>
        </div>
        {chip}
      </div>
      {children}
    </section>
  );
}

function DeviceChip({ text, label = "THIẾT BỊ ĐANG KIỂM TRA" }: { text: string; label?: string }) {
  return (
    <span className="flex max-w-[260px] items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[11px] text-zinc-600 shadow-sm">
      <AppleMini />
      <span>
        <span className="block text-[9px] tracking-wide text-zinc-400">{label}</span>
        <span className="font-semibold text-zinc-800">{text}</span>
      </span>
    </span>
  );
}

function AppleMini() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1-.1.8-2.3 1.7-3.4-.7-.3-2-1.2-2-2.1zM14.8 6.4c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2.1-.6 2.7-1.4z" />
    </svg>
  );
}

function OptionList({
  options,
  value,
  onChange,
  kind = "screen",
}: {
  options: { id: string; name: string; hint: string; tag?: string; tone?: string }[];
  value: string;
  onChange: (v: string) => void;
  kind?: "screen" | "body";
}) {
  const toneClass: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-600",
    warn: "bg-amber-50 text-amber-600",
    bad: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="space-y-3">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left ${
            value === o.id
              ? o.tone === "good"
                ? "border-[#e11d2e] bg-emerald-50/70"
                : "border-[#e11d2e] bg-white"
              : "border-zinc-200 bg-white"
          }`}
        >
          <span className={`grid h-12 w-12 place-items-center rounded-xl ${toneClass[o.tone ?? "good"]}`}>
            <ConditionGlyph kind={kind} tone={o.tone ?? "good"} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{o.name}</span>
            <span className="block text-sm text-zinc-500 mt-1">{o.hint}</span>
            {o.tag && (
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass[o.tone ?? "good"]}`}>
                {o.tag}
              </span>
            )}
          </span>
          <CheckBox on={value === o.id} />
        </button>
      ))}
    </div>
  );
}

function ConditionGlyph({ kind, tone }: { kind: "screen" | "body"; tone: string }) {
  if (kind === "body") {
    if (tone === "good") return <span className="text-lg">⌚+</span>;
    if (tone === "warn") return <span className="text-lg">⌚</span>;
    return <span className="text-lg">⌚✕</span>;
  }
  if (tone === "good") return <span className="text-lg">✦</span>;
  if (tone === "warn") return <span className="text-lg">▭</span>;
  return <span className="text-lg">✕</span>;
}

function IssueGlyph({ id }: { id: string }) {
  if (id === "hr") return <span className="text-lg">♡</span>;
  if (id === "gps") return <span className="text-lg">◷</span>;
  if (id === "spo2") return <span className="text-[11px] font-bold">O₂</span>;
  return <span className="text-lg">+</span>;
}

function PhotoCard({
  p,
  src,
  onFile,
  onClear,
}: {
  p: { id: string; label: string; hint: string };
  src?: string;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 text-left shadow-sm">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="font-semibold">{p.label}</span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-400">TÙY CHỌN</span>
      </div>
      {src ? (
        <div className="relative">
          <img src={src} alt={p.label} className="h-28 w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-600"
          >
            Xóa
          </button>
        </div>
      ) : (
        <label className="grid h-28 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-zinc-200 text-center text-sm text-[#e11d2e]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
          <span>
            <span className="mb-1 block text-2xl text-zinc-300">🖼</span>
            <span>{p.hint}</span>
          </span>
        </label>
      )}
    </div>
  );
}
