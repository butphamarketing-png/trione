"use client";

import { readAccounts, saveAccounts } from "@/lib/accounts";
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

export function saveStaffProfile(user: string, profile: StaffProfile) {
  const next = {
    name: profile.name.trim(),
    address: profile.address.trim(),
    phone: profile.phone.trim(),
  };
  sessionStorage.setItem(key(user), JSON.stringify(next));
  const session = readSession();
  if (session && session.user === user) saveSession({ ...session, name: next.name });
  const accounts = readAccounts();
  const index = accounts.findIndex((item) => item.user.toLowerCase() === user.toLowerCase());
  if (index >= 0 && accounts[index].name !== next.name) {
    const nextAccounts = accounts.map((item, itemIndex) => (itemIndex === index ? { ...item, name: next.name } : item));
    saveAccounts(nextAccounts);
  }
  return next;
}
