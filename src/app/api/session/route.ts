import { NextResponse } from "next/server";
import { readRequestSession } from "@/lib/api-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = readRequestSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, user: session.user, role: session.role });
}
