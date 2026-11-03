"use client";

import { use } from "react";
import { RequestDetail } from "@/components/request-detail";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequestDetail id={id} backHref="/nhan-vien/yeu-cau" backLabel="Trở về" />;
}
