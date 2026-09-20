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
  if (pass !== "123456") return null;
  const u = user.trim().toLowerCase();
  if (u === "admin" || u.includes("admin")) {
    return { user: "admin", role: "admin", name: "Admin TRIONE", title: "Quản trị hệ thống" };
  }
  if (u === "sala.hcm" || u.includes("ctv") || u.includes("sala")) {
    return { user: "sala.hcm", role: "ctv", name: "CTV Sala", title: "Cộng tác viên" };
  }
  return { user: "nv.anh", role: "staff", name: "Nguyễn Minh Anh", title: "Nhân viên thẩm định" };
}
