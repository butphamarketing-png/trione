import { readAccounts, roleSession } from "@/lib/accounts";

export type DemoRole = "admin" | "staff" | "ctv";

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

export function resolveLogin(user: string, pass: string): DemoSession | null {
  const account = readAccounts().find((item) => item.user.toLowerCase() === user.trim().toLowerCase());
  if (!account || account.password !== pass || account.status !== "Hoạt động") return null;
  return roleSession(account);
}
