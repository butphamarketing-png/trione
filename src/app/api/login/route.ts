import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createServiceClient, ensurePrivateBucket, MEDIA_BUCKET, PRIVATE_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE = "store.json";
const PUBLIC_FILE = "catalog/store.json";
const localFile = path.join(process.cwd(), ".data", "catalog.json");

type StoredAccount = {
  user?: string;
  name?: string;
  role?: string;
  status?: string;
  password?: string;
};

function asStore(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && item) out[key] = item;
  }
  return out;
}

async function readLocal() {
  try {
    return asStore(JSON.parse(await readFile(localFile, "utf8")));
  } catch {
    return {};
  }
}

async function readJson(bucket: string, file: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return {};
  try {
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${file}?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${key}`, apikey: key },
      cache: "no-store",
    });
    if (!res.ok) return {};
    return asStore(await res.json());
  } catch {
    return {};
  }
}

async function readAccounts(): Promise<StoredAccount[]> {
  const local = await readLocal();
  let remote: Record<string, string> = {};
  const supabase = createServiceClient();
  if (supabase) {
    try {
      await ensurePrivateBucket(supabase);
      const stored = await readJson(PRIVATE_BUCKET, FILE);
      const legacy = await readJson(MEDIA_BUCKET, PUBLIC_FILE);
      remote = { ...legacy, ...stored };
    } catch {
      remote = {};
    }
  }
  const raw = remote["trione-accounts"] || local["trione-accounts"] || "[]";
  try {
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isAdminRole(role: string | undefined) {
  const value = (role || "").toLowerCase();
  return value.includes("quản trị") || value.includes("admin");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { user?: string; pass?: string } | null;
  const user = body?.user?.trim() ?? "";
  const pass = body?.pass ?? "";
  if (!user || !pass) return NextResponse.json({ ok: false }, { status: 401 });

  const accounts = await readAccounts();
  const account = accounts.find((item) => (item.user || "").trim().toLowerCase() === user.toLowerCase());
  if (account) {
    if (account.status === "Ngưng" || account.password !== pass) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const admin = isAdminRole(account.role);
    return NextResponse.json({
      ok: true,
      session: {
        user: account.user?.trim() || user,
        role: admin ? "admin" : "staff",
        name: account.name?.trim() || user,
        title: admin ? "Quản trị hệ thống" : account.role || "Nhân viên thẩm định",
      },
    });
  }

  // Chỉ dùng mật khẩu môi trường khi catalog chưa có tài khoản quản trị.
  if (accounts.some((item) => isAdminRole(item.role))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

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
