import { TradeInWizard } from "../wizard";
import { tradeMetadata } from "@/lib/public-seo";
import { readServerSiteSettings } from "@/lib/server-site-settings";

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return tradeMetadata(await readServerSiteSettings(), slug ?? []);
}

export default async function ThuCuPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <TradeInWizard initialSlug={slug ?? []} />;
}
