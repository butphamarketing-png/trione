import { NextResponse } from "next/server";
import { readRequestSession } from "@/lib/api-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  id?: string;
  name?: string;
  oldDevice?: string;
  newDevice?: string;
  reviewUrl?: string;
};

export async function POST(req: Request) {
  const session = readRequestSession(req);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Payload;
  const id = (body.id || "").trim();
  if (!id) return NextResponse.json({ error: "Thiếu mã đơn" }, { status: 400 });

  const name = (body.name || "").trim() || "Khách";
  const oldDevice = (body.oldDevice || "").trim() || "—";
  const newDevice = (body.newDevice || "").trim() || "—";
  const reviewUrl = (body.reviewUrl || "").trim();
  const text = [
    "Đơn thu cũ mới — đang chờ duyệt",
    `Mã: ${id}`,
    `Khách: ${name}`,
    `Máy cũ: ${oldDevice}`,
    `Đổi mới: ${newDevice}`,
    reviewUrl ? `Duyệt: ${reviewUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const sent = { telegram: false, webhook: false };
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chat = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
  if (token && chat) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
      });
      sent.telegram = res.ok;
    } catch {
      sent.telegram = false;
    }
  }

  const webhook = process.env.ORDER_WEBHOOK_URL?.trim() ?? "";
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, name, oldDevice, newDevice, reviewUrl, text }),
      });
      sent.webhook = res.ok;
    } catch {
      sent.webhook = false;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
