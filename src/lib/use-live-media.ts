"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getMediaSnapshot,
  getServerMediaSnapshot,
  hydrateMediaFromCloud,
  mediaSrc,
  subscribeMedia,
} from "@/lib/demo-media";

export function useMediaSrc(id: string | undefined, fallback: string) {
  const overrides = useSyncExternalStore(subscribeMedia, getMediaSnapshot, getServerMediaSnapshot);
  useEffect(() => {
    void hydrateMediaFromCloud();
  }, []);
  if (!id) return fallback;
  return mediaSrc(id, fallback, overrides);
}

export function useMediaOverrides() {
  const overrides = useSyncExternalStore(subscribeMedia, getMediaSnapshot, getServerMediaSnapshot);
  useEffect(() => {
    void hydrateMediaFromCloud();
  }, []);
  return overrides;
}
