"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DemoSession } from "@/lib/session";

const SessionContext = createContext<DemoSession | null>(null);

export function SessionProvider({ value, children }: { value: DemoSession; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAuthSession() {
  return useContext(SessionContext);
}
