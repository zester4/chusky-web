"use client";

import { useEffect, useRef, useState } from "react";
import { DASHBOARD_IDLE_TIMEOUT_MS, DASHBOARD_REFRESH_INTERVAL_MS, shouldPollDashboard } from "./polling-policy";

export const CHUSKY_DATA_CHANGED = "chusky:data-changed";

/** Notify open dashboard surfaces that a successful write changed account data. */
export function notifyChuskyDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHUSKY_DATA_CHANGED));
}

/** Track real dashboard activity so unattended tabs stop making API calls. */
export function useDashboardActivity(): number {
  const [lastActivityAt, setLastActivityAt] = useState(() => Date.now());
  useEffect(() => {
    let idleTimer: number | undefined;
    const markActive = () => {
      const now = Date.now();
      setLastActivityAt(now);
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setLastActivityAt(0), DASHBOARD_IDLE_TIMEOUT_MS);
    };
    const markVisibility = () => {
      if (document.visibilityState === "visible") markActive();
      else setLastActivityAt(0);
    };
    markActive();
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll", "focus"];
    for (const event of activityEvents) window.addEventListener(event, markActive, { passive: true });
    document.addEventListener("visibilitychange", markVisibility);
    return () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      for (const event of activityEvents) window.removeEventListener(event, markActive);
      document.removeEventListener("visibilitychange", markVisibility);
    };
  }, []);
  return lastActivityAt;
}

/**
 * Keep a page truthful when work is completed by another surface (Telegram,
 * a worker, a webhook, or another browser tab). Refreshes pause while hidden.
 */
export function useLiveData(load: () => void | Promise<void>, intervalMs = DASHBOARD_REFRESH_INTERVAL_MS) {
  const loadRef = useRef(load);
  const loadingRef = useRef(false);
  const mountedActiveRef = useRef(false);
  const lastActivityAt = useDashboardActivity();
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (!shouldPollDashboard({ visibilityState: document.visibilityState, lastActivityAt, now: Date.now() }) || loadingRef.current) return;
      loadingRef.current = true;
      try {
        void Promise.resolve(loadRef.current()).finally(() => { loadingRef.current = false; });
      } catch {
        loadingRef.current = false;
      }
    };
    window.addEventListener(CHUSKY_DATA_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, intervalMs);
    const active = lastActivityAt > 0;
    if (active && mountedActiveRef.current) refresh();
    mountedActiveRef.current = active;
    return () => {
      window.removeEventListener(CHUSKY_DATA_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, [intervalMs, lastActivityAt]);
}
