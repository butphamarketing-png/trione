import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/api-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
