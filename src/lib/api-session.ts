import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "trione-auth";
const MAX_AGE = 60 * 60 * 24 * 7;

export type ApiRole = "admin" | "staff" | "ctv" | "customer";

export type ApiSession = {
  user: string;
  role: ApiRole;
  exp: number;
};

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSWORD || "";
}

function sign(body: string) {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(body).digest("base64url");
}

export function sealSession(user: string, role: ApiRole) {
  const payload: ApiSession = { user, role, exp: Date.now() + MAX_AGE * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  if (!signature) return "";
  return `${body}.${signature}`;
}

export function openSession(token: string): ApiSession | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (!expected) return null;
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ApiSession;
    if (!parsed.user || !parsed.role || !parsed.exp || parsed.exp < Date.now()) return null;
    if (!["admin", "staff", "ctv", "customer"].includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readRequestSession(req: Request): ApiSession | null {
  const header = req.headers.get("cookie") || "";
  const parts = header.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!found) return null;
  const token = decodeURIComponent(found.slice(SESSION_COOKIE.length + 1));
  return openSession(token);
}

export function withSessionCookie(res: NextResponse, user: string, role: ApiRole) {
  const token = sealSession(user, role);
  if (!token) return res;
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
