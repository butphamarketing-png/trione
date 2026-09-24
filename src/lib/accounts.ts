"use client";

import type { DemoRole, DemoSession } from "@/lib/session";

export type AccountRole = "Quản trị" | "Nhân viên" | "Cộng tác viên";
export type AccountStatus = "Hoạt động" | "Ngưng";

export type Account = {
  id: string;
  name: string;
  user: string;
  role: AccountRole;
  status: AccountStatus;
  password: string;
};

const KEY = "trione-accounts";

export const accountRoles: AccountRole[] = ["Quản trị", "Nhân viên", "Cộng tác viên"];

const seed: Account[] = [
  { id: "1", name: "Nguyễn Minh Anh", user: "nv.anh", role: "Nhân viên", status: "Hoạt động", password: "123456" },
  { id: "2", name: "Admin TRIONE", user: "admin", role: "Quản trị", status: "Hoạt động", password: "123456" },
  { id: "3", name: "CTV Sala", user: "sala.hcm", role: "Cộng tác viên", status: "Hoạt động", password: "123456" },
];

function normalizeRole(value: string): AccountRole {
  if (value === "Quản trị" || value.toLowerCase().includes("admin") || value.toLowerCase().includes("quản trị")) return "Quản trị";
  if (value === "Cộng tác viên" || value.toLowerCase().includes("ctv") || value.toLowerCase().includes("cộng tác")) return "Cộng tác viên";
  return "Nhân viên";
}

function normalizeAccount(value: (Partial<Omit<Account, "role">> & { role?: string }) | null | undefined, index: number): Account {
  return {
    id: value?.id || String(index + 1),
    name: value?.name?.trim() || "",
    user: value?.user?.trim() || "",
    role: normalizeRole(value?.role || "Nhân viên"),
    status: value?.status === "Ngưng" ? "Ngưng" : "Hoạt động",
    password: value?.password || "123456",
  };
}

export function readAccounts(): Account[] {
  if (typeof window === "undefined") return seed.map((item) => ({ ...item }));
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return seed.map((item) => ({ ...item }));
    const parsed = JSON.parse(raw) as Partial<Account>[];
    if (!Array.isArray(parsed) || !parsed.length) return seed.map((item) => ({ ...item }));
    return parsed.map((item, index) => normalizeAccount(item, index)).filter((item) => item.user && item.name);
  } catch {
    return seed.map((item) => ({ ...item }));
  }
}

export function saveAccounts(list: Array<Partial<Omit<Account, "role">> & { role?: string }>) {
  const next = list.map((item, index) => normalizeAccount(item, index)).filter((item) => item.user && item.name);
  sessionStorage.setItem(KEY, JSON.stringify(next));
  void import("@/lib/catalog-sync").then((mod) => {
    mod.touchCatalogKey(KEY);
    return mod.publishCatalog();
  });
  return next;
}

export function roleSession(account: Account): DemoSession {
  const role: DemoRole = account.role === "Quản trị" ? "admin" : account.role === "Cộng tác viên" ? "ctv" : "staff";
  const title = account.role === "Quản trị" ? "Quản trị hệ thống" : account.role === "Cộng tác viên" ? "Cộng tác viên" : "Nhân viên thẩm định";
  return { user: account.user, role, name: account.name, title };
}
