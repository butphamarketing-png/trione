import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { user?: string; pass?: string } | null;
  const user = body?.user?.trim() ?? "";
  const pass = body?.pass ?? "";
  const adminUser = process.env.ADMIN_USER?.trim() ?? "";
  const adminPass = process.env.ADMIN_PASSWORD ?? "";
  if (!adminUser || !adminPass || user.toLowerCase() !== adminUser.toLowerCase() || pass !== adminPass) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    session: {
      user: adminUser,
      role: "admin",
      name: "Admin Lendoi",
      title: "Quản trị hệ thống",
    },
  });
}
