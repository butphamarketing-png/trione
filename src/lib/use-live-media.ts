"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getMediaSnapshot,
  getServerMediaSnapshot,
  hydrateMediaFromCloud,
  mediaSrc,
  subscribeMedia,
} from "@/lib/demo-media";

export function useMediaSrc(id: string | undefined, fallback: string) {
  const overrides = useSyncExternalStore(subscribeMedia, getMediaSnapshot, getServerMediaSnapshot);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    void hydrateMediaFromCloud();
  }, []);
  if (!id || !ready) return fallback;
  return mediaSrc(id, fallback, overrides);
}

export function useMediaOverrides() {
  const overrides = useSyncExternalStore(subscribeMedia, getMediaSnapshot, getServerMediaSnapshot);
  useEffect(() => {
    void hydrateMediaFromCloud();
  }, []);
  return overrides;
}
