import { TrioneLogo } from "@/components/trione-logo";

export function MaintenancePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-[0_20px_60px_rgba(26,29,33,0.08)]">
        <div className="flex justify-center">
          <TrioneLogo size={72} />
        </div>
        <h1 className="mt-8 text-2xl font-extrabold text-trione sm:text-3xl">Website đang bảo trì</h1>
        <p className="mt-4 leading-relaxed text-foreground/70">
          Website hiện đang trong trạng thái bảo trì và tạm ngưng hoạt động.
          <br />
          Xin lỗi quý khách vì sự bất tiện này. Vui lòng quay lại sau.
        </p>
      </div>
    </main>
  );
}
