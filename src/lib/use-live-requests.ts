"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  customersFrom,
  getRequestSnapshot,
  getServerRequestSnapshot,
  kpisFrom,
  subscribeRequests,
} from "@/lib/demo-requests";

export function useLiveRequests() {
  return useSyncExternalStore(subscribeRequests, getRequestSnapshot, getServerRequestSnapshot);
}

export function useLiveKpis() {
  const live = useLiveRequests();
  return useMemo(() => kpisFrom(live), [live]);
}

export function useLiveCustomers() {
  const live = useLiveRequests();
  return useMemo(() => customersFrom(live), [live]);
}
