"use client";

import { useEffect, useRef } from "react";

export const CHUSKY_DATA_CHANGED = "chusky:data-changed";

/** Notify open dashboard surfaces that a successful write changed account data. */
export function notifyChuskyDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHUSKY_DATA_CHANGED));
}

/**
 * Keep a page truthful when work is completed by another surface (Telegram,
 * a worker, a webhook, or another browser tab). Refreshes pause while hidden.
 */
export function useLiveData(load: () => void | Promise<void>, intervalMs = 10_000) {
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void loadRef.current();
    };
    window.addEventListener(CHUSKY_DATA_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, intervalMs);
    return () => {
      window.removeEventListener(CHUSKY_DATA_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
}
