"use client";

import { use } from "react";
import { TradeInWizard } from "../wizard";

export default function ThuCuPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = use(params);
  return <TradeInWizard initialSlug={slug ?? []} />;
}
