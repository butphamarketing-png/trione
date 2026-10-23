"use client";

import { readAccounts, writeAccounts } from "@/lib/accounts";
import { readSession, saveSession } from "@/lib/session";

export type StaffProfile = {
  name: string;
  address: string;
  phone: string;
};

const storeAddress = "300/41/13A Nguyễn Thái Sơn, Phường Hạnh Thông, TP. Hồ Chí Minh";

const defaults: Record<string, StaffProfile> = {
  "nv.anh": {
    name: "Nguyễn Minh Anh",
    address: storeAddress,
    phone: "0705.825.888",
  },
  "sala.hcm": {
    name: "CTV Sala",
    address: "Garmin Sala",
    phone: "0705.825.888",
  },
};

function key(user: string) {
  return `trione-staff-profile:${user}`;
}

export function readStaffProfile(user: string, fallbackName = ""): StaffProfile {
  const base = defaults[user] ?? {
    name: fallbackName || user,
    address: storeAddress,
    phone: "0705.825.888",
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = sessionStorage.getItem(key(user));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<StaffProfile>;
    return {
      name: parsed.name?.trim() || base.name,
      address: parsed.address?.trim() || base.address,
      phone: parsed.phone?.trim() || base.phone,
    };
  } catch {
    return base;
  }
}

export async function saveStaffProfile(user: string, profile: StaffProfile) {
  const next = {
    name: profile.name.trim(),
    address: profile.address.trim(),
    phone: profile.phone.trim(),
  };
  const storageKey = key(user);
  sessionStorage.setItem(storageKey, JSON.stringify(next));
  const session = readSession();
  if (session && session.user === user) saveSession({ ...session, name: next.name });
  const accounts = readAccounts();
  const index = accounts.findIndex((item) => item.user.toLowerCase() === user.toLowerCase());
  const nameChanged = index >= 0 && accounts[index].name !== next.name;
  if (nameChanged) {
    writeAccounts(accounts.map((item, itemIndex) => (itemIndex === index ? { ...item, name: next.name } : item)));
  }
  const mod = await import("@/lib/catalog-sync");
  mod.touchCatalogKey(storageKey);
  if (nameChanged) mod.touchCatalogKey("trione-accounts");
  const ok = await mod.publishCatalogNow();
  return { profile: next, ok };
}
