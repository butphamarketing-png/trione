"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MarkedImage, StoreFooter, WizardHeader, Stepper, CheckBox } from "@/components/store-footer";
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
} from "@/data/catalog";
import { fallbackLevel1, readLevel1Categories, type Level1Category } from "@/lib/level1-categories";
import { fallbackLevel2, readLevel2Categories, type Level2Category } from "@/lib/level2-categories";
import { conditionAmount, quoteTradeIn, readTradeProducts, type TradeProduct } from "@/lib/trade-products";
import { fallbackExchangeProducts, readExchangeProducts, type ExchangeProduct } from "@/lib/exchange-products";
import { resolveGrade, vnd } from "@/lib/pricing";
import { formatCreatedAt, makeRequestCode, saveTradeRequest } from "@/lib/demo-requests";
import { fileToDataUrl } from "@/lib/demo-media";
import { readSession } from "@/lib/session";
import { readStaffProfile } from "@/lib/staff-profile";
import { phoneHref, setPageSeo, useSiteSettings } from "@/lib/site-settings";

type FunctionStatus = "ok" | "issues" | "dead";

const lineGuideHref = "/huong-dan/nhan-dien-dong-san-pham";
const allGenerations = "Tất cả thế hệ";

function modelGeneration(name: string) {
  const year = name.match(/\((20\d{2})\)/);
  if (year) return year[1];
  const labeled = name.match(/(Series|Ultra|SE|Watch|fēnix|fenix|Forerunner|PACE|Race|GTR|GT)\s*(\d+)/i);
  if (labeled) return `${labeled[1]} ${labeled[2]}`.replace(/\s+/g, " ");
  return "Thế hệ đầu";
}

export function TradeInWizard({ initialSlug = [] }: { initialSlug?: string[] }) {
  const router = useRouter();
  const site = useSiteSettings();
  const [step, setStep] = useState(1);
  const [brandId, setBrandId] = useState("apple");
  const [otherBrand, setOtherBrand] = useState("");
  const [lineId, setLineId] = useState("ultra");
  const [modelId, setModelId] = useState("ultra2");
  const [serial, setSerial] = useState("");
  const [fn, setFn] = useState<FunctionStatus>("ok");
  const [issueIds, setIssueIds] = useState<string[]>([]);
  const [issueNote, setIssueNote] = useState("");
  const [screen, setScreen] = useState("excellent");
  const [body, setBody] = useState("excellent");
  const [battery, setBattery] = useState("good");
  const [strap, setStrap] = useState("good");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const photoFiles = useRef<Record<string, File>>({});
  const sendingLock = useRef(false);
  const [sending, setSending] = useState(false);
  const [garminId, setGarminId] = useState("");
  const [series, setSeries] = useState("TẤT CẢ");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modelQ, setModelQ] = useState("");
  const [modelGen, setModelGen] = useState(allGenerations);
  const [garminQ, setGarminQ] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [categories, setCategories] = useState<Level1Category[]>(fallbackLevel1);
  const [level2, setLevel2] = useState<Level2Category[]>(() => fallbackLevel2("apple"));
  const [products, setProducts] = useState<TradeProduct[]>(() => readTradeProducts("ultra"));
  const [exchangeProducts, setExchangeProducts] = useState<ExchangeProduct[]>(fallbackExchangeProducts);
  const [exchangeBrand, setExchangeBrand] = useState("garmin");
  const [activeKey, setActiveKey] = useState("apple");
  const [routeApplied, setRouteApplied] = useState(initialSlug.length === 0);
  const appliedKey = useRef("");
  const openedRoute = useRef(false);

  const brand = brands.find((b) => b.id === brandId);
  const line = lines.find((l) => l.id === lineId);
  const lineLabel = level2.find((item) => item.code === lineId)?.name || line?.name || "sản phẩm";
  const pickedProduct = products.find((item) => item.code === modelId);
  const catalogModel = models.find((m) => m.id === modelId);
  const model = pickedProduct
    ? {
        id: pickedProduct.code,
        name: pickedProduct.name,
        specs: pickedProduct.specs,
        blurb: pickedProduct.blurb,
        prices: pickedProduct.prices,
        lineId: pickedProduct.line,
      }
    : catalogModel;
  const activeCategory = categories.find((item) => item.key === activeKey);
  const chosenName =
    brandId === "other" ? otherBrand.trim() || activeCategory?.name || "Thương hiệu khác" : activeCategory?.name || brand?.name || "";
  const pickedExchange = exchangeProducts.find((item) => item.code === garminId);
  const catalogExchange = garminNew.find((item) => item.id === garminId) ?? garminNew[0];
  const garmin = pickedExchange
    ? {
        id: pickedExchange.code,
        name: pickedExchange.name,
        specs: pickedExchange.specs,
        series: pickedExchange.series,
        listPrice: pickedExchange.price,
        face: pickedExchange.face,
        strap: pickedExchange.strap,
        time: pickedExchange.time,
        image: pickedExchange.image,
      }
    : { ...catalogExchange, image: "" };
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
  const tradeIn = quoteTradeIn({
    product: pickedProduct,
    grade,
    issueIds: fn === "issues" ? issueIds : [],
    fallback: catalogModel?.prices,
    functionStatus: fn,
    screen,
    body,
  });
  const due = Math.max(0, garmin.listPrice - tradeIn);
  const photoCount = photoSlots.filter((p) => photos[p.id]).length;
  const exchangeBrands = categories.filter((item) => exchangeProducts.some((product) => product.parent === item.code));
  const exchangeSeries = ["TẤT CẢ", ...new Set(exchangeProducts.filter((item) => item.parent === exchangeBrand).map((item) => item.series).filter(Boolean))];
  const visibleGarmin = exchangeProducts.filter((item) => {
    if (item.parent !== exchangeBrand) return false;
    const bySeries = series === "TẤT CẢ" || item.series === series;
    const byQ = !garminQ.trim() || `${item.name} ${item.specs} ${item.series} ${item.brandName}`.toLowerCase().includes(garminQ.toLowerCase());
    return bySeries && byQ;
  });
  const lineProducts = products.filter((item) => item.line === lineId);
  const generations = [allGenerations, ...new Set(lineProducts.map((item) => modelGeneration(item.name)))];
  const visibleModels = lineProducts.filter((item) => {
    const byGen = modelGen === allGenerations || modelGeneration(item.name) === modelGen;
    const haystack = `${item.name} ${item.specs} ${item.blurb}`.toLowerCase();
    const byQ = !modelQ.trim() || haystack.includes(modelQ.trim().toLowerCase());
    return byGen && byQ;
  });

  const displayStep = step === 52 ? 5 : step === 11 ? 1 : step >= 10 ? 9 : step;
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

  function chooseCategory(item: Level1Category) {
    setActiveKey(item.key);
    const known = brands.some((brand) => brand.id === item.code);
    if (!known) {
      setBrandId("other");
      setOtherBrand(item.code === "other" ? "" : item.name);
      setLineId("");
      setModelId("");
      return;
    }
    setBrandId(item.code);
    setOtherBrand("");
    const first = readLevel2Categories(item.code)[0];
    if (!first) {
      setLineId("");
      setModelId("");
      return;
    }
    setLineId(first.code);
    const nextModel = readTradeProducts(first.code)[0];
    setModelId(nextModel?.code ?? "");
  }

  useEffect(() => {
    function sync() {
      const list = readLevel1Categories();
      setCategories(list);
      setActiveKey((current) => {
        if (list.some((item) => item.key === current)) return current;
        return (list.find((item) => item.code === "apple") ?? list[0])?.key ?? "";
      });
      if (!list.length) setBrandId("");
    }
    sync();
    void import("@/lib/catalog-sync").then(async (mod) => {
      const changed = await mod.ensureCatalog();
      if (changed) sync();
    });
    const onCatalog = () => sync();
    const onFocus = () => {
      void import("@/lib/catalog-sync").then(async (mod) => {
        await mod.hydrateCatalog();
        sync();
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("trione-catalog", onCatalog);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("trione-catalog", onCatalog);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const item = categories.find((entry) => entry.key === activeKey);
    if (!item || appliedKey.current === item.key) return;
    const known = brands.some((entry) => entry.id === item.code);
    const matches = known ? brandId === item.code : brandId === "other";
    appliedKey.current = item.key;
    if (matches) return;
    chooseCategory(item);
  }, [activeKey, categories, brandId]);

  useEffect(() => {
    setLevel2(readLevel2Categories(brandId));
  }, [brandId, categories]);

  useEffect(() => {
    setProducts(readTradeProducts(lineId));
  }, [lineId, level2]);

  useEffect(() => {
    const reload = () => setProducts(readTradeProducts(lineId));
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [lineId]);

  useEffect(() => {
    setModelGen(allGenerations);
    setModelQ("");
  }, [lineId]);

  useEffect(() => {
    const list = readExchangeProducts();
    setExchangeProducts(list);
    setExchangeBrand((current) => (list.some((item) => item.parent === current) ? current : list[0]?.parent || "garmin"));
    setGarminId((current) => (current && list.some((item) => item.code === current) ? current : ""));
  }, [categories]);

  useEffect(() => {
    if (openedRoute.current) return;
    openedRoute.current = true;
    const [brandSlug, lineSlug, productSlug] = initialSlug;
    if (!brandSlug) {
      setRouteApplied(true);
      return;
    }
    const list = readLevel1Categories();
    const item = list.find((entry) => entry.slug === brandSlug || entry.code === brandSlug);
    if (!item) {
      setRouteApplied(true);
      return;
    }
    setCategories(list);
    chooseCategory(item);
    if (!lineSlug) {
      setStep(2);
      setRouteApplied(true);
      return;
    }
    const line = readLevel2Categories(item.code).find((entry) => entry.slug === lineSlug || entry.code === lineSlug);
    if (line) {
      setLineId(line.code);
      const productList = readTradeProducts(line.code);
      const product = productSlug
        ? productList.find((entry) => entry.slug === productSlug || entry.code === productSlug)
        : productList[0];
      if (product) setModelId(product.code);
      setStep(productSlug && product ? 4 : 3);
    } else {
      setStep(2);
    }
    setRouteApplied(true);
  }, [initialSlug]);

  useEffect(() => {
    if (!routeApplied) return;
    const cat = categories.find((item) => item.key === activeKey);
    const known = Boolean(cat && brands.some((brand) => brand.id === cat.code));
    let path = "/thu-cu";
    if (known && cat && step >= 2) {
      path += `/${cat.slug}`;
      if (step >= 3 && lineId) {
        const current = readLevel2Categories(cat.code).find((item) => item.code === lineId);
        if (current) path += `/${current.slug}`;
        if (step >= 4 && modelId) {
          const product = readTradeProducts(lineId).find((item) => item.code === modelId);
          if (product) path += `/${product.slug}`;
        }
      }
    }
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [routeApplied, step, activeKey, lineId, modelId, categories]);

  useEffect(() => {
    const origin = (site.canonical || site.website || "https://trione.vn").replace(/\/$/, "");
    const brandItem = categories.find((item) => item.key === activeKey);
    const lineItem = level2.find((item) => item.code === lineId);
    const subject = step >= 9 && pickedExchange ? pickedExchange : step >= 3 && pickedProduct ? pickedProduct : step >= 2 && lineItem ? lineItem : step >= 2 ? brandItem : undefined;
    const name = subject?.name || "";
    const title = subject?.seoTitle || (name ? `${name} | Thu cũ đổi mới | ${site.company}` : site.seoTitle);
    const description = subject?.description || pickedProduct?.blurb || pickedProduct?.specs || site.description;
    const keywords = subject?.keywords || [name, chosenName, "thu cũ", "đổi mới", site.company].filter(Boolean).join(", ");
    let path = "/thu-cu";
    if (brandItem && brandItem.code !== "other" && step >= 2) {
      path += `/${brandItem.slug}`;
      if (lineItem && step >= 3) path += `/${lineItem.slug}`;
      if (pickedProduct && step >= 4) path += `/${pickedProduct.slug}`;
    }
    setPageSeo({ title, description, keywords, canonical: `${origin}${path}` });
    return () => setPageSeo(null);
  }, [site, step, activeKey, categories, level2, lineId, pickedExchange, pickedProduct, chosenName]);

  async function uploadRequestPhotos(code: string) {
    const files = photoSlots.map((slot) => photoFiles.current[slot.id]).filter((file): file is File => Boolean(file));
    const urls: string[] = [];
    for (const file of files) {
      try {
        const dataUrl = await fileToDataUrl(file, 900);
        if (!dataUrl.startsWith("data:image/")) continue;
        const blob = await (await fetch(dataUrl)).blob();
        const body = new FormData();
        body.set("id", `yeucau-${code}-${urls.length}`);
        body.set("file", new File([blob], "photo.webp", { type: blob.type || "image/webp" }));
        const uploaded = await fetch("/api/media", { method: "POST", body });
        const saved = (await uploaded.json()) as { url?: string };
        if (uploaded.ok && saved.url) urls.push(saved.url);
      } catch {
        /* keep the request even if one photo fails */
      }
    }
    return urls;
  }

  async function next() {
    if (sendingLock.current) return;
    if (step === 1 && brandId === "other") {
      setStep(11);
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
      sendingLock.current = true;
      setSending(true);
      const uploadedPhotos = await uploadRequestPhotos(code);
      const now = new Date();
      const tags = [
        fn === "ok" ? "CHỨC NĂNG TỐT" : fn === "dead" ? "KHÔNG HOẠT ĐỘNG" : "CÓ VẤN ĐỀ",
        `MÀN HÌNH ${screen === "excellent" ? "XUẤT SẮC" : screen === "light" ? "NHẸ" : "HƯ HỎNG"}`,
        `THÂN MÁY ${body === "excellent" ? "XUẤT SẮC" : body === "light" ? "MÒN" : "NẶNG"}`,
      ];
      const session = readSession();
      const byStaff = session && session.role !== "admin";
      const profile = byStaff ? readStaffProfile(session.user, session.name) : null;
      saveTradeRequest({
        id: code,
        username: byStaff ? session.user : "khach.trione",
        name: byStaff ? profile?.name || session.name : `Khách ${site.company}`,
        createdAt: formatCreatedAt(now),
        updatedAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        address: profile?.address || site.address,
        brand: chosenName || "Khác",
        oldDevice:
          brandId === "other"
            ? `${otherBrand.trim()} · sẽ thẩm định tại cửa hàng`
            : `${model?.name ?? ""} · ${model?.specs ?? ""}`,
        imeiOld: serial.trim() || "Chưa nhập",
        grade: `loại ${grade}`,
        tags,
        photoCount: uploadedPhotos.length,
        photos: uploadedPhotos,
        newDevice: garmin.name,
        newSpecs: garmin.specs,
        newPrice: garmin.listPrice,
        tradeIn,
        note: issueNote,
        status: "dang-cho-duyet",
        source: byStaff ? `Tạo bởi nhân viên ${session.user}` : "Tạo bởi khách hàng TRIONE.VN",
      });
      setRequestCode(code);
      setSubmitted(true);
      setSending(false);
      return;
    }
    setStep((s) => Math.min(10, s + 1));
  }
  function back() {
    if (step === 11) {
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

  function isPhotoFile(file: File) {
    if (file.type.startsWith("image/")) return true;
    if (!file.type) return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
    return false;
  }

  function assignFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(isPhotoFile);
    if (!files.length) return;
    setPhotos((prev) => {
      const next = { ...prev };
      const empty = photoSlots.filter((p) => !next[p.id]);
      files.forEach((file, i) => {
        const slot = empty[i] ?? photoSlots.find((p) => !next[p.id]);
        if (!slot) return;
        if (next[slot.id]?.startsWith("blob:")) URL.revokeObjectURL(next[slot.id]);
        photoFiles.current[slot.id] = file;
        next[slot.id] = URL.createObjectURL(file);
      });
      return next;
    });
  }

  function setSlotPhoto(id: string, file?: File) {
    if (!file || !isPhotoFile(file)) return;
    photoFiles.current[id] = file;
    setPhotos((prev) => {
      if (prev[id]?.startsWith("blob:")) URL.revokeObjectURL(prev[id]);
      return { ...prev, [id]: URL.createObjectURL(file) };
    });
  }

  function onPickPhotos(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) assignFiles(e.target.files);
    e.target.value = "";
  }

  function clearSlotPhoto(id: string) {
    setPhotos((prev) => {
      if (prev[id]?.startsWith("blob:")) URL.revokeObjectURL(prev[id]);
      delete photoFiles.current[id];
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
        <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
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
                <p className="text-[11px] font-semibold tracking-wide text-emerald-800">ĐÃ GỬI YÊU CẦU VỀ ADMIN</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {deviceLabel} → {garmin.name}
                </p>
                <p className="mt-2 text-sm">
                  Giá thu cũ {vnd(tradeIn)} · Giá sau khi trừ {vnd(due)}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 text-sm">
                <p className="text-[11px] text-zinc-400">MÃ ĐƠN HÀNG</p>
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
      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Stepper current={displayStep} doneAll={step === 10} />

        {step === 1 && (
          <Section
            title="Chọn thương hiệu đồng hồ"
            sub="Đồng hồ bạn muốn thu cũ thuộc thương hiệu nào?"
            chip={<span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-[#e11d2e]">● Chọn 01 thương hiệu</span>}
          >
            <div className="grid sm:grid-cols-3 gap-x-8 gap-y-6">
              {categories.length ? (
                categories.map((item) =>
                  item.code === "other" ? (
                    <div key={item.key} className="flex items-start gap-3">
                      <Level1Mark item={item} />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <input
                          value={otherBrand}
                          onChange={(event) => {
                            setOtherBrand(event.target.value);
                            setActiveKey(item.key);
                            setBrandId("other");
                            setLineId("");
                            setModelId("");
                          }}
                          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                          placeholder="Nhập tên thương hiệu..."
                        />
                      </div>
                      <CheckBox on={activeKey === item.key} />
                    </div>
                  ) : (
                    <button key={item.key} type="button" onClick={() => chooseCategory(item)} aria-pressed={activeKey === item.key} className={`pick flex items-center gap-3 rounded-2xl px-2 py-2 text-left ${activeKey === item.key ? "is-on bg-rose-50" : ""}`}>
                      <Level1Mark item={item} />
                      <span className="flex-1">
                        <h2 className="block text-base font-semibold">{item.name}</h2>
                        {item.line ? <span className="text-sm text-zinc-500">{item.line}</span> : null}
                      </span>
                      <CheckBox on={activeKey === item.key} />
                    </button>
                  )
                )
              ) : (
                <p className="text-sm text-zinc-500">Chưa có danh mục cấp 1 đang hiển thị.</p>
              )}
            </div>
          </Section>
        )}

        {step === 11 && (
          <Section
            title="Cần tư vấn trực tiếp"
            sub={`${chosenName} chưa có trong danh mục định giá trực tuyến. TRIONE.VN sẽ báo giá khi xem máy tại cửa hàng hoặc qua điện thoại.`}
            chip={<span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">● Thương hiệu khác</span>}
          >
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-lg font-semibold text-zinc-900">Thương hiệu: {chosenName}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-700">
                Chương trình thu cũ trực tuyến hiện áp dụng cho các thương hiệu có trong danh mục. Với thương hiệu này, bạn vui lòng đến cửa hàng
                hoặc gọi hotline để nhân viên tư vấn và thẩm định trực tiếp.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a href={phoneHref(site.hotline)} className="rounded-xl bg-[#e11d2e] px-5 py-4 text-white">
                  <span className="block text-[11px] font-medium tracking-wide text-white/80">HOTLINE</span>
                  <span className="mt-1 block text-xl font-bold">{site.hotline}</span>
                  <span className="mt-1 block text-sm text-white/90">Gọi để được tư vấn thu cũ</span>
                </a>
                <div className="rounded-xl bg-white px-5 py-4">
                  <span className="block text-[11px] font-medium tracking-wide text-zinc-400">CỬA HÀNG</span>
                  <span className="mt-1 block font-semibold">{site.address}</span>
                  {site.hours ? <span className="mt-1 block text-sm text-zinc-600">{site.hours}</span> : null}
                </div>
              </div>
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section
            title={`Đây là dòng ${chosenName} nào?`}
            sub="Chọn dòng sản phẩm được hiển thị trên đồng hồ hoặc trong ứng dụng kết nối."
            chip={
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm">
                {brandId === "apple" ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1-.1.8-2.3 1.7-3.4-.7-.3-2-1.2-2-2.1zM14.8 6.4c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2.1-.6 2.7-1.4z" />
                  </svg>
                ) : null}
                Thương hiệu: {chosenName}
              </span>
            }
          >
            <div className="grid md:grid-cols-2 gap-4">
              {level2.length ? (
                level2.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => {
                      setLineId(l.code);
                      const nextModel = readTradeProducts(l.code)[0];
                      setModelId(nextModel?.code ?? "");
                    }}
                    aria-pressed={lineId === l.code}
                    className={`pick flex gap-3 rounded-2xl border bg-white p-3 text-left sm:gap-4 sm:p-4 ${
                      lineId === l.code ? "is-on border-[#e11d2e] bg-rose-50/50" : "border-transparent"
                    }`}
                  >
                    {l.image ? (
                      <MarkedImage src={l.image} className="h-16 w-16 shrink-0 rounded-xl bg-[#f4f4f5] object-cover sm:h-[92px] sm:w-[120px]" />
                    ) : (
                      <LineThumb kind={l.thumb || "android"} />
                    )}
                    <span className="min-w-0 flex-1">
                      <h2 className="block text-base font-semibold leading-snug sm:text-lg">{l.name}</h2>
                      {l.blurb ? <span className="mt-1 block text-sm text-zinc-500">{l.blurb}</span> : null}
                      {lineId === l.code && (
                        <span className="mt-3 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs text-trione">
                          ĐÃ CHỌN
                        </span>
                      )}
                    </span>
                    {lineId === l.code ? <CheckBox on /> : <span className="self-center text-zinc-300">→</span>}
                  </button>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Chưa có danh mục cấp 2 đang hiển thị cho thương hiệu này.</p>
              )}
              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#e11d2e]"
                  onChange={(event) => {
                    if (event.target.checked) router.push(lineGuideHref);
                  }}
                />
                <span>
                  <span className="block font-semibold">Không biết dòng sản phẩm nào</span>
                  <span className="mt-1 block text-sm text-zinc-500">
                    Tick vào để xem bài hướng dẫn nhận diện dòng máy.
                  </span>
                  <a href={lineGuideHref} className="mt-2 inline-block text-sm font-medium text-[#e11d2e]">
                    {lineGuideHref}
                  </a>
                </span>
              </label>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section
            title={`Đây là mẫu ${lineLabel} nào?`}
            sub="Chọn đúng mẫu và kích thước phù hợp với đồng hồ của bạn."
            chip={
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm">
                <AppleMini />
                {chosenName} / {lineLabel}
              </span>
            }
          >
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
                <input
                  value={modelQ}
                  onChange={(e) => setModelQ(e.target.value)}
                  className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm"
                  placeholder="Tìm theo tên mẫu hoặc kích thước..."
                />
              </div>
              <label className="min-w-[180px] rounded-xl border bg-white px-4 py-2 text-xs text-zinc-500">
                <span className="block text-[10px] tracking-wide">▽ BỘ LỌC MẪU</span>
                <select
                  value={generations.includes(modelGen) ? modelGen : allGenerations}
                  onChange={(event) => setModelGen(event.target.value)}
                  className="w-full bg-transparent font-semibold text-zinc-800 outline-none"
                >
                  {generations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mb-3 text-xs text-zinc-400">
              Tìm thấy {visibleModels.length} mẫu {lineLabel}
            </p>
            <div className="space-y-3">
              {visibleModels.length ? (
                visibleModels.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setModelId(m.code)}
                    aria-pressed={modelId === m.code}
                    className={`pick flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left sm:gap-4 sm:p-4 ${
                      modelId === m.code ? "is-on border-[#e11d2e] bg-rose-50/40" : "border-zinc-100"
                    }`}
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f4f4f5] sm:h-[88px] sm:w-[120px]">
                      {m.image ? <MarkedImage src={m.image} className="h-full w-full object-cover" /> : <ModelThumb id={m.code} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold leading-snug">{m.name}</h3>
                        <CheckBox on={modelId === m.code} />
                      </div>
                      <p className="mt-1 text-sm leading-5 text-zinc-500">{m.blurb || m.specs || "Chưa có mô tả"}</p>
                      {modelId === m.code ? (
                        <span className="mt-2 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs text-trione">ĐÃ CHỌN</span>
                      ) : null}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  {lineProducts.length ? "Không có mẫu khớp với từ khóa hoặc bộ lọc." : "Chưa có sản phẩm đang hiển thị cho dòng này."}
                </p>
              )}
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
                  aria-pressed={fn === id}
                  className={`pick flex w-full items-start gap-4 rounded-2xl border p-5 text-left ${
                    fn === id
                      ? tone === "good"
                        ? "is-on border-[#e11d2e] bg-emerald-50/60"
                        : "is-on border-[#e11d2e] bg-rose-50/40"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl text-xl ${icon}`}>{mark}</span>
                  <span className="flex-1">
                    <h2 className="block text-base font-semibold">{title}</h2>
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
              {issues.map((i, issueIndex) => {
                const on = issueIds.includes(i.id);
                const level = Math.min(4, Math.max(1, grade));
                const issuePrice = pickedProduct?.gradePrices[level - 1]?.[issueIndex] ?? 0;
                return (
                  <button
                    key={i.id}
                    onClick={() =>
                      setIssueIds((prev) =>
                        on ? prev.filter((x) => x !== i.id) : [...prev, i.id]
                      )
                    }
                    aria-pressed={on}
                    className={`pick flex items-start gap-3 rounded-2xl border bg-white p-4 text-left ${
                      on ? "is-on border-[#e11d2e] bg-rose-50/50" : "border-zinc-100"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
                      <IssueGlyph id={i.id} />
                    </span>
                    <span className="flex-1">
                      <h3 className="block text-base font-semibold">{i.name}</h3>
                      <span className="block text-sm text-zinc-500">{i.hint}</span>
                      {issuePrice > 0 ? <span className="mt-1 block text-sm font-semibold text-[#e11d2e]">{vnd(issuePrice)}</span> : null}
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
            <OptionList
              kind="screen"
              options={screenOptions}
              value={screen}
              onChange={setScreen}
              prices={
                fn === "ok"
                  ? {
                      excellent: conditionAmount(pickedProduct, "screen", "excellent"),
                      light: conditionAmount(pickedProduct, "screen", "light"),
                      broken: conditionAmount(pickedProduct, "screen", "broken"),
                    }
                  : undefined
              }
            />
          </Section>
        )}

        {step === 7 && (
          <Section
            title="Thân máy và các nút bấm như thế nào?"
            sub="Kiểm tra viền, mặt lưng, các nút bấm và khu vực cảm biến của đồng hồ."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <OptionList
              kind="body"
              options={bodyOptions}
              value={body}
              onChange={setBody}
              prices={
                fn === "ok"
                  ? {
                      excellent: conditionAmount(pickedProduct, "body", "excellent"),
                      light: conditionAmount(pickedProduct, "body", "light"),
                      heavy: conditionAmount(pickedProduct, "body", "heavy"),
                    }
                  : undefined
              }
            />
          </Section>
        )}

        {step === 8 && (
          <Section
            title="Chụp hình ảnh thiết bị"
            sub="Không bắt buộc. Có thể tải từ máy, chụp bằng điện thoại, hoặc bỏ qua."
            chip={<DeviceChip text={deviceLabel} />}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <label className="relative inline-flex cursor-pointer items-center overflow-hidden rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white">
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={onPickPhotos}
                />
                <span className="pointer-events-none">+ Thư viện ảnh</span>
              </label>
              <label className="relative inline-flex cursor-pointer items-center overflow-hidden rounded-lg border bg-white px-4 py-2.5 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={onPickPhotos}
                />
                <span className="pointer-events-none">Chụp trực tiếp</span>
              </label>
              <span className="text-xs text-zinc-400">
                JPG, PNG, HEIC · Không bắt buộc
                <span className="mt-0.5 block">Chọn ảnh có sẵn hoặc mở camera để chụp sản phẩm.</span>
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
            title="Chọn sản phẩm muốn đổi mới"
            sub="Tick một sản phẩm đổi mới. Giá lấy từ danh sách sản phẩm đổi mới trong admin."
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
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {exchangeBrands.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setExchangeBrand(item.code);
                        setSeries("TẤT CẢ");
                        setGarminId((current) =>
                          exchangeProducts.some((product) => product.code === current && product.parent === item.code) ? current : ""
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        exchangeBrand === item.code ? "bg-black text-white" : "border bg-white"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {exchangeSeries.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeries(s)}
                      aria-pressed={series === s}
                      className={`pick rounded-full px-3 py-1 text-xs font-semibold ${
                        series === s ? "is-on bg-[#e11d2e] text-white" : "bg-white border"
                      }`}
                    >
                      {s === "TẤT CẢ" ? "TẤT CẢ" : s}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-zinc-400">{visibleGarmin.length} sản phẩm</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {visibleGarmin.map((g) => {
                    const extra = g.price - tradeIn;
                    return (
                      <button
                        key={g.key}
                        onClick={() => setGarminId(g.code)}
                        aria-pressed={garminId === g.code}
                        className={`pick flex items-center gap-3 rounded-2xl border bg-white p-3 text-left ${
                          garminId === g.code ? "is-on border-[#e11d2e] bg-rose-50/40" : "border-zinc-100"
                        }`}
                      >
                        <div className="grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3f3f4]">
                          {g.image ? (
                            <MarkedImage src={g.image} className="h-full w-full object-cover" />
                          ) : (
                            <GarminThumb id={g.code} face={g.face} strap={g.strap} time={g.time} />
                          )}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] tracking-wide text-zinc-400">{g.brandName} · {g.series}</span>
                          <h3 className="block font-semibold">{g.name}</h3>
                          <span className="block text-xs text-zinc-500">{g.specs}</span>
                          <span className="mt-1 block text-xs text-zinc-500">Giá sản phẩm {vnd(g.price)}</span>
                          <span className={`block text-sm font-semibold ${extra <= 0 ? "text-emerald-700" : "text-[#e11d2e]"}`}>
                            {extra <= 0 ? "Không cần trả thêm" : `Cần trả thêm ${vnd(extra)}`}
                          </span>
                          {garminId === g.code ? (
                            <span className="mt-2 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs text-trione">ĐÃ CHỌN</span>
                          ) : null}
                        </span>
                        <CheckBox on={garminId === g.code} />
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
                {pickedExchange ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e11d2e] p-2">
                    <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg bg-[#f3f3f4]">
                      {garmin.image ? (
                        <MarkedImage src={garmin.image} className="h-full w-full object-cover" />
                      ) : (
                        <GarminThumb id={garmin.id} face={garmin.face} strap={garmin.strap} time={garmin.time} size={56} />
                      )}
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="text-[10px] text-[#e11d2e]">ĐÃ TICK</p>
                      <p className="font-semibold leading-tight">{garmin.name}</p>
                      <p className="text-xs text-zinc-500">{garmin.specs}</p>
                      <p className="text-xs">{vnd(garmin.listPrice)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-500">Tick một sản phẩm đổi mới để xem tạm tính.</p>
                )}
                {pickedExchange ? (
                  <>
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
                  </>
                ) : null}
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
            title="Báo giá đổi mới"
            sub="Mã đơn hàng, sản phẩm thu cũ, sản phẩm đổi mới và số tiền sau khi trừ."
            chip={
              <span className="rounded-full bg-white px-3 py-1.5 text-xs shadow-sm">
                Mã đơn hàng <b>{requestCode || "Đang tạo mã…"}</b>
              </span>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">SẢN PHẨM THU CŨ</span>
                  <button type="button" onClick={() => setStep(brandId === "other" ? 1 : 3)} className="text-[#e11d2e]">
                    Chỉnh sửa
                  </button>
                </div>
                <p className="mt-2 text-xl font-bold">{deviceLabel}</p>
                <p className="text-sm text-zinc-500">{brandId === "other" ? "Giá thu cũ sẽ được thẩm định tại cửa hàng" : model?.specs}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {fn === "ok" ? "Hoạt động tốt" : fn === "dead" ? "Không hoạt động" : "Có vấn đề"} · Màn hình{" "}
                  {screen === "excellent" ? "xuất sắc" : screen === "light" ? "đã qua sử dụng nhẹ" : "hư hỏng"} · Thân máy{" "}
                  {body === "excellent" ? "xuất sắc" : body === "light" ? "hao mòn thường" : "hao mòn nặng"}
                </p>
                <p className="mt-3 text-sm">
                  Giá loại {fn === "dead" ? 5 : grade} · Giá thu cũ <b>{vnd(tradeIn)}</b>
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">SẢN PHẨM ĐỔI MỚI</span>
                  <button type="button" onClick={() => setStep(9)} className="text-[#e11d2e]">
                    Đổi mẫu khác
                  </button>
                </div>
                <div className="mt-3 flex gap-3">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3f3f4]">
                    {garmin.image ? (
                      <MarkedImage src={garmin.image} className="h-full w-full object-cover" />
                    ) : (
                      <GarminThumb id={garmin.id} face={garmin.face} strap={garmin.strap} time={garmin.time} size={64} />
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="text-[10px] text-zinc-400">{garmin.series}</p>
                    <p className="text-lg font-bold">{garmin.name}</p>
                    <p className="text-zinc-500">{garmin.specs}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  Giá sản phẩm mới <b>{vnd(garmin.listPrice)}</b>
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] text-zinc-400">GIÁ THU CŨ</p>
                  <p className="text-xl font-bold text-emerald-700">{vnd(tradeIn)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">GIÁ SẢN PHẨM MỚI</p>
                  <p className="text-xl font-bold">{vnd(garmin.listPrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">GIÁ SAU KHI TRỪ THU CŨ</p>
                  <p className="text-xl font-bold text-[#e11d2e]">{vnd(due)}</p>
                  <p className="text-xs text-zinc-500">
                    {vnd(garmin.listPrice)} − {vnd(tradeIn)}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <label className="flex items-center gap-2 text-sm">
                  <button type="button" onClick={() => setAgreed((value) => !value)} aria-label="Xác nhận thông tin báo giá">
                    <CheckBox on={agreed} />
                  </button>
                  <button type="button" onClick={() => setAgreed((value) => !value)}>
                    Tôi xác nhận thông tin trên là chính xác
                  </button>
                </label>
                <button
                  type="button"
                  onClick={next}
                  disabled={!agreed || sending}
                  className="rounded-xl bg-[#e11d2e] px-6 py-3 font-semibold text-white disabled:bg-zinc-300"
                >
                  {sending ? "Đang gửi…" : "Gửi yêu cầu về admin"}
                </button>
              </div>
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
                  Đã chọn: <b className="text-[#e11d2e]">{chosenName}</b>
                </>
              )}
              {step === 11 && (
                <>
                  Đã ghi nhận: <b className="text-[#e11d2e]">{chosenName}</b>
                </>
              )}
              {step === 2 && (
                <>
                  Đã chọn: <b className="text-[#e11d2e]">{lineLabel}</b>
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
              {step === 9 && (pickedExchange ? `Đã tick: ${pickedExchange.name}` : "Tick một sản phẩm đổi mới")}
              {step === 10 && (
                <>
                  Mã đơn hàng <b className="text-[#e11d2e]">{requestCode}</b>
                </>
              )}
            </p>
            {step !== 9 && step !== 10 && step !== 11 && (
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
                      : step === 1 && brandId === "other"
                        ? "Nhận tư vấn  ›"
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
    </div>
  );
}

function Level1Mark({ item }: { item: Level1Category }) {
  if (item.image) return <MarkedImage src={item.image} className="h-14 w-14 rounded-2xl object-cover" />;
  return <BrandMark id={item.code || "other"} />;
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="border-l-4 border-[#e11d2e] pl-4">
          <h1 className="text-2xl font-bold leading-tight sm:text-[28px]">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-zinc-500 sm:text-base">{sub}</p>
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
  prices,
}: {
  options: { id: string; name: string; hint: string; tag?: string; tone?: string }[];
  value: string;
  onChange: (v: string) => void;
  kind?: "screen" | "body";
  prices?: Record<string, number>;
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
          aria-pressed={value === o.id}
          className={`pick flex w-full items-start gap-4 rounded-2xl border p-5 text-left ${
            value === o.id
              ? o.tone === "good"
                ? "is-on border-[#e11d2e] bg-emerald-50/70"
                : "is-on border-[#e11d2e] bg-rose-50/40"
              : "border-zinc-200 bg-white"
          }`}
        >
          <span className={`grid h-12 w-12 place-items-center rounded-xl ${toneClass[o.tone ?? "good"]}`}>
            <ConditionGlyph kind={kind} tone={o.tone ?? "good"} />
          </span>
          <span className="flex-1">
            <h2 className="block text-base font-semibold">{o.name}</h2>
            <span className="block text-sm text-zinc-500 mt-1">{o.hint}</span>
            {o.tag && (
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass[o.tone ?? "good"]}`}>
                {o.tag}
              </span>
            )}
            {prices && prices[o.id] > 0 ? <span className="mt-1 block text-sm font-semibold text-[#e11d2e]">{vnd(prices[o.id])}</span> : null}
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
          <MarkedImage src={src} alt={p.label} className="h-28 w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-600"
          >
            Xóa
          </button>
        </div>
      ) : (
        <div className="grid h-28 place-items-center rounded-xl border-2 border-dashed border-zinc-200 text-center text-sm text-zinc-400">
          <span>
            <span className="mb-1 block text-2xl">🖼</span>
            <span>{p.hint}</span>
          </span>
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <PhotoSource label="Thư viện" onFile={onFile} />
        <PhotoSource label="Chụp" capture onFile={onFile} />
      </div>
    </div>
  );
}

function PhotoSource({ label, capture, onFile }: { label: string; capture?: boolean; onFile: (file: File) => void }) {
  return (
    <label className="relative block cursor-pointer overflow-hidden rounded-lg border bg-zinc-50 px-2 py-1.5 text-center text-[11px] font-semibold text-zinc-700">
      <input
        type="file"
        accept={capture ? "image/*" : "image/*,.heic,.heif"}
        capture={capture ? "environment" : undefined}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <span className="pointer-events-none">{label}</span>
    </label>
  );
}
