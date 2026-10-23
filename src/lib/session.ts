import { readAccounts, roleSession } from "@/lib/accounts";

export type DemoRole = "admin" | "staff" | "ctv" | "customer";

export type DemoSession = {
  user: string;
  role: DemoRole;
  name: string;
  title: string;
};

const KEY = "trione-demo-session";

export function saveSession(s: DemoSession) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function readSession(): DemoSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}

export function homeForRole(role: DemoRole) {
  if (role === "admin") return "/admin";
  if (role === "customer") return "/thu-cu";
  return "/nhan-vien";
}

export function resolveLogin(user: string, pass: string): DemoSession | null {
  const account = readAccounts().find((item) => item.user.toLowerCase() === user.trim().toLowerCase());
  if (!account || !account.password || account.password !== pass || account.status !== "Hoạt động") return null;
  return roleSession(account);
}

export async function confirmServerSession() {
  const local = readSession();
  if (!local) return null;
  const res = await fetch("/api/session", { cache: "no-store" }).catch(() => null);
  if (!res?.ok) {
    clearSession();
    return null;
  }
  const data = (await res.json()) as { user?: string; role?: DemoRole };
  if (!data.user || data.user.toLowerCase() !== local.user.toLowerCase() || data.role !== local.role) {
    clearSession();
    return null;
  }
  return local;
}
