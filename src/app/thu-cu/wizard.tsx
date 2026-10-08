"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MarkedImage, StoreFooter, WizardHeader, Stepper, CheckBox } from "@/components/store-footer";
import { GarminThumb } from "@/components/watch-face";
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
import { fallbackTradeProducts, quoteTradeIn, readTradeProducts, type TradeProduct } from "@/lib/trade-products";
import { fallbackExchangeProducts, readExchangeProducts, type ExchangeProduct } from "@/lib/exchange-products";
import { exchangeDue, resolveGrade, vnd } from "@/lib/pricing";
import { formatCreatedAt, makeRequestCode, saveTradeRequest } from "@/lib/demo-requests";
import { fileToDataUrl } from "@/lib/demo-media";
import { readSession } from "@/lib/session";
import { readStaffProfile } from "@/lib/staff-profile";
import { phoneHref, setPageSeo, useSiteSettings } from "@/lib/site-settings";
import { useMediaSrc } from "@/lib/use-live-media";

type FunctionStatus = "ok" | "issues" | "dead";

const lineGuideHref = "/huong-dan/nhan-dien-dong-san-pham";
const allGenerations = "Tất cả thế hệ";

function openingFromSlug(slug: string[]) {
  const categories = fallbackLevel1();
  const [brandSlug, lineSlug, productSlug] = slug;
  const brand = brandSlug ? categories.find((item) => item.slug === brandSlug || item.code === brandSlug) : undefined;
  if (!brand) return { brandId: "apple", activeKey: "apple", lineId: "ultra", modelId: "ultra2", step: 1 };
  if (brand.code === "other") return { brandId: "other", activeKey: brand.key, lineId: "", modelId: "", step: 1 };
  const line = lineSlug ? fallbackLevel2(brand.code).find((item) => item.slug === lineSlug || item.code === lineSlug) : undefined;
  const product =
    line && productSlug ? fallbackTradeProducts(line.code).find((item) => item.slug === productSlug || item.code === productSlug) : undefined;
  return {
    brandId: brand.code,
    activeKey: brand.key,
    lineId: line?.code ?? "",
    modelId: product?.code ?? "",
    step: product ? 4 : 1,
  };
}

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
  const [opening] = useState(() => openingFromSlug(initialSlug));
  const [step, setStep] = useState(opening.step);
  const [brandId, setBrandId] = useState(opening.brandId);
  const [otherBrand, setOtherBrand] = useState("");
  const [lineId, setLineId] = useState(opening.lineId);
  const [modelId, setModelId] = useState(opening.modelId);
  const [serial, setSerial] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [openMenu, setOpenMenu] = useState<"brand" | "line" | "model" | "">("");
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
  const [level2, setLevel2] = useState<Level2Category[]>(() => fallbackLevel2(opening.brandId === "other" ? "" : opening.brandId));
  const [products, setProducts] = useState<TradeProduct[]>(() => (opening.lineId ? fallbackTradeProducts(opening.lineId) : []));
  const [exchangeProducts, setExchangeProducts] = useState<ExchangeProduct[]>(fallbackExchangeProducts);
  const [exchangeBrand, setExchangeBrand] = useState("garmin");
  const [activeKey, setActiveKey] = useState(opening.activeKey);
  const brandRef = useRef(brandId);
  brandRef.current = brandId;
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
        supportPrice: pickedExchange.supportPrice,
        face: pickedExchange.face,
        strap: pickedExchange.strap,
        time: pickedExchange.time,
        image: pickedExchange.image,
      }
    : { ...catalogExchange, image: "", supportPrice: 0 };
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
  const due = exchangeDue(garmin.listPrice, tradeIn, garmin.supportPrice);
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

  const displayStep = step === 11 || step <= 3 ? 1 : step === 4 ? 2 : step === 5 || step === 52 ? 3 : step === 6 ? 4 : step === 7 ? 5 : step === 8 ? 6 : 7;
  const canNext = useMemo(() => {
    if (step === 1) return brandId === "other" ? otherBrand.trim().length >= 2 : !!modelId;
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
    setLineId("");
    setModelId("");
  }

  useEffect(() => {
    function sync() {
      const list = readLevel1Categories();
      setCategories(list);
      setActiveKey((current) => {
        if (list.some((item) => item.key === current)) return current;
        const sameBrand = list.find((item) => item.code === brandRef.current);
        if (sameBrand) return sameBrand.key;
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
    const reload = () => setLevel2(readLevel2Categories(brandId));
    reload();
    window.addEventListener("trione-catalog", reload);
    return () => window.removeEventListener("trione-catalog", reload);
  }, [brandId, categories]);

  useEffect(() => {
    const reload = () => setProducts(readTradeProducts(lineId));
    reload();
    window.addEventListener("trione-catalog", reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener("trione-catalog", reload);
      window.removeEventListener("focus", reload);
    };
  }, [lineId, level2]);

  useEffect(() => {
    setModelGen(allGenerations);
    setModelQ("");
  }, [lineId]);

  useEffect(() => {
    if (!modelId || modelGen === allGenerations) return;
    const current = products.find((item) => item.code === modelId && item.line === lineId);
    if (current && modelGeneration(current.name) !== modelGen) setModelId("");
  }, [modelGen, modelId, lineId, products]);

  useEffect(() => {
    function reload() {
      const list = readExchangeProducts();
      setExchangeProducts(list);
      setExchangeBrand((current) => (list.some((item) => item.parent === current) ? current : list[0]?.parent || "garmin"));
      setGarminId((current) => (current && list.some((item) => item.code === current) ? current : ""));
    }
    reload();
    window.addEventListener("trione-catalog", reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener("trione-catalog", reload);
      window.removeEventListener("focus", reload);
    };
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
      setLineId("");
      setModelId("");
      setStep(1);
      setRouteApplied(true);
      return;
    }
    const line = readLevel2Categories(item.code).find((entry) => entry.slug === lineSlug || entry.code === lineSlug);
    if (line) {
      setLineId(line.code);
      const productList = readTradeProducts(line.code);
      const product = productSlug ? productList.find((entry) => entry.slug === productSlug || entry.code === productSlug) : undefined;
      if (product) {
        setModelId(product.code);
        setStep(4);
      } else {
        setModelId("");
        setStep(1);
      }
    } else {
      setLineId("");
      setModelId("");
      setStep(1);
    }
    setRouteApplied(true);
  }, [initialSlug]);

  useEffect(() => {
    if (!routeApplied) return;
    const cat = categories.find((item) => item.key === activeKey);
    const known = Boolean(cat && brands.some((brand) => brand.id === cat.code));
    let path = "/thu-cu";
    if (known && cat && brandId !== "other") {
      path += `/${cat.slug}`;
      if (lineId) {
        const current = readLevel2Categories(cat.code).find((item) => item.code === lineId);
        if (current) {
          path += `/${current.slug}`;
          if (step >= 4 && modelId) {
            const product = readTradeProducts(lineId).find((item) => item.code === modelId);
            if (product) path += `/${product.slug}`;
          }
        }
      }
    }
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [routeApplied, step, activeKey, lineId, modelId, categories]);

  useEffect(() => {
    const origin = (site.canonical || site.website || "https://trione.vn").replace(/\/$/, "");
    const brandItem = categories.find((item) => item.key === activeKey);
    const lineItem = level2.find((item) => item.code === lineId);
    const subject = step >= 9 && pickedExchange ? pickedExchange : pickedProduct ? pickedProduct : lineItem && lineId ? lineItem : brandItem;
    const name = subject?.name || "";
    const title = subject?.seoTitle || (name ? `${name} | Thu cũ đổi mới | ${site.company}` : site.seoTitle);
    const description = subject?.description || pickedProduct?.blurb || pickedProduct?.specs || site.description;
    const keywords = subject?.keywords || [name, chosenName, "thu cũ", "đổi mới", site.company].filter(Boolean).join(", ");
    let path = "/thu-cu";
    if (brandItem && brandItem.code !== "other" && brandId !== "other") {
      path += `/${brandItem.slug}`;
      if (lineItem && lineId) path += `/${lineItem.slug}`;
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
    if (step === 1) {
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
        imeiNew: newSerial.trim(),
        newPrice: garmin.listPrice,
        tradeIn,
        supportPrice: garmin.supportPrice,
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
    if (step === 4) {
      setStep(1);
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
          <Stepper current={7} doneAll />
          <section>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="border-l-4 border-[#e11d2e] pl-4">
                <h1 className="text-[28px] leading-tight font-bold">Yêu cầu đã gửi thành công</h1>
                <p className="mt-1 text-zinc-500">Nhân viên {site.company} sẽ liên hệ để thẩm định trong giờ làm việc.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                ✓ ĐÃ HOÀN TẤT 7 BƯỚC
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-5">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-emerald-800">ĐÃ GỬI YÊU CẦU VỀ ADMIN</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {deviceLabel} → {garmin.name}
                </p>
                <p className="mt-2 text-sm">
                  Giá thu cũ {vnd(tradeIn)} · Trợ giá {vnd(garmin.supportPrice)} · Giá thực {vnd(due)}
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
            title="Chọn đồng hồ muốn thu cũ"
            sub="Chọn thương hiệu, dòng và mẫu trong cùng một bước."
            chip={<span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-[#e11d2e]">● Tick trong sổ xuống</span>}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <TickSelect
                label="Thương hiệu"
                placeholder="Chọn thương hiệu"
                value={activeKey}
                open={openMenu === "brand"}
                onOpen={(next) => setOpenMenu(next ? "brand" : "")}
                options={categories.map((item) => ({ id: item.key, name: item.name, hint: item.line, image: item.image }))}
                onChange={(key) => {
                  const item = categories.find((entry) => entry.key === key);
                  if (item) chooseCategory(item);
                }}
              />
              <TickSelect
                label="Dòng sản phẩm"
                placeholder={brandId === "other" ? "Không cần chọn dòng" : "Chọn dòng"}
                value={lineId}
                disabled={!brandId || brandId === "other"}
                open={openMenu === "line"}
                onOpen={(next) => setOpenMenu(next ? "line" : "")}
                options={level2.map((item) => ({ id: item.code, name: item.name, hint: item.blurb, image: item.image, mediaId: `line:${item.code}` }))}
                onChange={(code) => {
                  setLineId(code);
                  setModelId("");
                  setModelGen(allGenerations);
                }}
              />
              <div>
                <TickSelect
                  label="Mẫu"
                  placeholder={lineId ? "Chọn mẫu" : "Chọn dòng trước"}
                  value={modelId}
                  disabled={!lineId || brandId === "other"}
                  searchable
                  open={openMenu === "model"}
                  onOpen={(next) => setOpenMenu(next ? "model" : "")}
                  options={visibleModels.map((item) => ({ id: item.code, name: item.name, hint: item.specs || item.blurb, image: item.image, mediaId: `model:${item.code}` }))}
                  onChange={setModelId}
                />
                {lineId && generations.length > 1 ? (
                  <label className="mt-2 block text-xs text-zinc-500">
                    Thế hệ
                    <select
                      value={generations.includes(modelGen) ? modelGen : allGenerations}
                      onChange={(event) => setModelGen(event.target.value)}
                      className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
                    >
                      {generations.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
            {brandId === "other" ? (
              <label className="mt-4 block text-sm">
                <span className="mb-1 block font-medium">Tên thương hiệu</span>
                <input
                  value={otherBrand}
                  onChange={(event) => setOtherBrand(event.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-3 text-sm"
                  placeholder="Nhập tên thương hiệu..."
                />
              </label>
            ) : null}
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#e11d2e]"
                onChange={(event) => {
                  if (event.target.checked) router.push(lineGuideHref);
                }}
              />
              <span>
                <span className="block font-semibold">Không biết dòng sản phẩm nào</span>
                <span className="mt-1 block text-sm text-zinc-500">Tick vào để xem bài hướng dẫn nhận diện dòng máy.</span>
                <a href={lineGuideHref} className="mt-2 inline-block text-sm font-medium text-[#e11d2e]">
                  Xem bài hướng dẫn
                </a>
              </span>
            </label>
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

        {step === 4 && (
          <Section
            title="Nhập IMEI hoặc số sê-ri"
            sub="Không bắt buộc. Có thể bỏ qua và bổ sung khi thẩm định tại cửa hàng."
            chip={<DeviceChip text={deviceLabel} image={pickedProduct?.image} modelId={modelId} />}
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
                    <p className="font-semibold">{brandId === "apple" ? "Tìm trên Apple Watch" : `Tìm trên ${chosenName || "đồng hồ"}`}</p>
                    <p className="text-zinc-500">
                      {brandId === "apple" ? "Cài đặt · Cài đặt chung · Giới thiệu" : "Mở phần cài đặt của đồng hồ hoặc ứng dụng của hãng"}
                    </p>
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
            chip={<DeviceChip text={deviceLabel} image={pickedProduct?.image} modelId={modelId} />}
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
            chip={<DeviceChip text={deviceLabel} image={pickedProduct?.image} modelId={modelId} />}
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
            chip={<DeviceChip text={deviceLabel} image={pickedProduct?.image} modelId={modelId} />}
          >
            <OptionList kind="screen" options={screenOptions} value={screen} onChange={setScreen} />
          </Section>
        )}

        {step === 7 && (
          <Section
            title="Thân máy và các nút bấm như thế nào?"
            sub="Kiểm tra viền, mặt lưng, các nút bấm và khu vực cảm biến của đồng hồ."
            chip={<DeviceChip text={deviceLabel} image={pickedProduct?.image} modelId={modelId} />}
          >
            <OptionList kind="body" options={bodyOptions} value={body} onChange={setBody} />
          </Section>
        )}

        {step === 8 && (
          <Section
            title="Chụp hình ảnh thiết bị"
            sub="Không bắt buộc. Có thể tải từ máy, chụp bằng điện thoại, hoặc bỏ qua."
            chip={<DeviceChip text={deviceLabel} image={pickedProduct?.image} modelId={modelId} />}
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
                  {tradeIn === 0 ? <p className="mt-1 max-w-[140px] text-[10px] leading-4 text-zinc-400">Chưa có giá thu cho tình trạng này.</p> : null}
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
                    const extra = exchangeDue(g.price, tradeIn, g.supportPrice);
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
                          <ProductShot
                            mediaId={`garmin:${g.code}`}
                            src={g.image}
                            thumb={<GarminThumb id={g.code} face={g.face} strap={g.strap} time={g.time} />}
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] tracking-wide text-zinc-400">{g.brandName} · {g.series}</span>
                          <h3 className="block font-semibold">{g.name}</h3>
                          <span className="block text-xs text-zinc-500">{g.specs}</span>
                          <span className="mt-1 block text-xs text-zinc-500">Giá sản phẩm {vnd(g.price)}</span>
                          {g.supportPrice > 0 ? <span className="block text-xs text-emerald-700">Trợ giá − {vnd(g.supportPrice)}</span> : null}
                          <span className={`block text-sm font-semibold ${extra === 0 ? "text-emerald-700" : "text-[#e11d2e]"}`}>
                            {extra === 0 ? "Không cần trả thêm" : `Cần trả thêm ${vnd(extra)}`}
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
                      <ProductShot
                        mediaId={`garmin:${garmin.id}`}
                        src={garmin.image}
                        thumb={<GarminThumb id={garmin.id} face={garmin.face} strap={garmin.strap} time={garmin.time} size={56} />}
                      />
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
                    <label className="mt-3 block text-sm">
                      <span className="mb-1 block text-[10px] font-semibold tracking-wide text-zinc-500">SỐ SERI MÁY MỚI · KHÔNG BẮT BUỘC</span>
                      <input
                        value={newSerial}
                        onChange={(event) => setNewSerial(event.target.value.toUpperCase())}
                        maxLength={18}
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        placeholder="Nhập số seri máy mới"
                      />
                    </label>
                    <div className="mt-4 space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span>Giá sản phẩm mới</span>
                        <span>{vnd(garmin.listPrice)}</span>
                      </p>
                      <p className="flex justify-between text-emerald-700">
                        <span>Khấu trừ máy cũ</span>
                        <span>− {vnd(tradeIn)}</span>
                      </p>
                      <p className="flex justify-between text-emerald-700">
                        <span>Trợ giá</span>
                        <span>− {vnd(garmin.supportPrice)}</span>
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
                  <button type="button" onClick={() => setStep(1)} className="text-[#e11d2e]">
                    Chỉnh sửa
                  </button>
                </div>
                <div className="mt-2 flex gap-3">
                  <LiveImage mediaId={modelId ? `model:${modelId}` : ""} src={pickedProduct?.image} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{deviceLabel}</p>
                    <p className="text-sm text-zinc-500">{brandId === "other" ? "Giá thu cũ sẽ được thẩm định tại cửa hàng" : model?.specs}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {fn === "ok" ? "Hoạt động tốt" : fn === "dead" ? "Không hoạt động" : "Có vấn đề"} · Màn hình{" "}
                  {screen === "excellent" ? "xuất sắc" : screen === "light" ? "đã qua sử dụng nhẹ" : "hư hỏng"} · Thân máy{" "}
                  {body === "excellent" ? "xuất sắc" : body === "light" ? "hao mòn thường" : "hao mòn nặng"}
                </p>
                <p className="mt-3 text-sm">
                  Giá loại {fn === "dead" ? 5 : grade} · Giá thu cũ <b>{vnd(tradeIn)}</b>
                </p>
                {tradeIn === 0 ? <p className="mt-1 text-xs text-zinc-400">Chưa có giá thu cho tình trạng này.</p> : null}
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
                    <ProductShot
                      mediaId={`garmin:${garmin.id}`}
                      src={garmin.image}
                      thumb={<GarminThumb id={garmin.id} face={garmin.face} strap={garmin.strap} time={garmin.time} size={64} />}
                    />
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
                <p className="mt-1 text-sm text-zinc-500">Số seri máy mới: {newSerial.trim() || "Chưa nhập"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[11px] text-zinc-400">GIÁ SẢN PHẨM MỚI</p>
                  <p className="text-xl font-bold">{vnd(garmin.listPrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">GIÁ THU CŨ</p>
                  <p className="text-xl font-bold text-emerald-700">{vnd(tradeIn)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">TRỢ GIÁ</p>
                  <p className="text-xl font-bold text-emerald-700">{vnd(garmin.supportPrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">GIÁ THỰC</p>
                  <p className="text-xl font-bold text-[#e11d2e]">{vnd(due)}</p>
                  <p className="text-xs text-zinc-500">
                    {vnd(garmin.listPrice)} − {vnd(tradeIn)} − {vnd(garmin.supportPrice)}
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
                  Đã chọn: <b className="text-[#e11d2e]">{brandId === "other" ? chosenName : model?.name || (lineId ? lineLabel : chosenName)}</b>
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

function TickSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
  searchable,
  open,
  onOpen,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { id: string; name: string; hint?: string; image?: string; mediaId?: string }[];
  onChange: (id: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpen]);
  const selected = options.find((item) => item.id === value);
  const shown = options.filter((item) => !q.trim() || `${item.name} ${item.hint ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <p className="mb-1 text-xs font-semibold tracking-wide text-zinc-500">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOpen(!open)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        <span className="flex min-w-0 items-center gap-2">
          <LiveImage mediaId={selected?.mediaId} src={selected?.image} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          <span className={`min-w-0 truncate ${selected ? "font-semibold text-zinc-900" : "text-zinc-400"}`}>{selected?.name || placeholder}</span>
        </span>
        <span className="text-zinc-400">▾</span>
      </button>
      {open && !disabled ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-white p-1 shadow-lg">
          {searchable ? (
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="mb-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Tìm theo tên mẫu hoặc kích thước..."
            />
          ) : null}
          {shown.length ? (
            shown.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  onOpen(false);
                  setQ("");
                }}
                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-rose-50"
              >
                <CheckBox on={item.id === value} />
                <LiveImage mediaId={item.mediaId} src={item.image} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0">
                  <span className="block font-medium">{item.name}</span>
                  {item.hint ? <span className="block text-xs text-zinc-500">{item.hint}</span> : null}
                </span>
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-sm text-zinc-500">Không có mục phù hợp.</p>
          )}
        </div>
      ) : null}
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

function LiveImage({ mediaId, src, className }: { mediaId?: string; src?: string; className: string }) {
  const photo = useMediaSrc(mediaId, src || "");
  if (!photo) return null;
  return <img src={photo} alt="" className={className} />;
}

function ProductShot({ mediaId, src, thumb }: { mediaId: string; src?: string; thumb: ReactNode }) {
  const override = useMediaSrc(mediaId, "");
  const photo = override || src || "";
  if (photo) return <MarkedImage src={photo} className="h-full w-full object-cover" />;
  return thumb;
}

function DeviceChip({ text, image, modelId, label = "THIẾT BỊ ĐANG KIỂM TRA" }: { text: string; image?: string; modelId?: string; label?: string }) {
  const photo = useMediaSrc(modelId ? `model:${modelId}` : "", image || "");
  return (
    <span className="flex max-w-[260px] items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[11px] text-zinc-600 shadow-sm">
      {photo ? <img src={photo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <WatchMini />}
      <span>
        <span className="block text-[9px] tracking-wide text-zinc-400">{label}</span>
        <span className="font-semibold text-zinc-800">{text}</span>
      </span>
    </span>
  );
}

function WatchMini() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="7" y="5" width="10" height="14" rx="3" />
      <path d="M9 5V3.5h6V5M9 19v1.5h6V19M12 9v3l2 1" />
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
