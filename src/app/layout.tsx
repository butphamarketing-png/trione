import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { SiteDocument } from "@/components/site-document";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TRIONE.VN — Chương trình thu cũ đồng hồ",
  description: "Định giá nhanh, quy trình minh bạch. Thu cũ đổi mới đồng hồ thể thao tại TRIONE.VN.",
  keywords: ["TRIONE.VN", "thu cũ", "đổi mới", "đồng hồ"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${beVietnam.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteDocument />
        {children}
      </body>
    </html>
  );
}
