"use client";

import { useEffect, useRef, useState } from "react";
import { DASHBOARD_IDLE_TIMEOUT_MS, DASHBOARD_REFRESH_INTERVAL_MS, shouldPollDashboard, shouldRefreshAfterReturn } from "./polling-policy";

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
  const lastRefreshAtRef = useRef(0);
  const lastActivityAtRef = useRef(0);
  const lastActivityAt = useDashboardActivity();
  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => { lastActivityAtRef.current = lastActivityAt; }, [lastActivityAt]);

  useEffect(() => {
    const refresh = (force = false) => {
      const now = Date.now();
      if (!shouldPollDashboard({ visibilityState: document.visibilityState, lastActivityAt: lastActivityAtRef.current, now }) || loadingRef.current) return;
      if (!force && !shouldRefreshAfterReturn(lastRefreshAtRef.current, now)) return;
      lastRefreshAtRef.current = now;
      loadingRef.current = true;
      try {
        void Promise.resolve(loadRef.current()).finally(() => { loadingRef.current = false; });
      } catch {
        loadingRef.current = false;
      }
    };
    const refreshFromWrite = () => refresh(true);
    const refreshFromReturn = () => refresh();
    window.addEventListener(CHUSKY_DATA_CHANGED, refreshFromWrite);
    window.addEventListener("focus", refreshFromReturn);
    document.addEventListener("visibilitychange", refreshFromReturn);
    const timer = window.setInterval(refresh, intervalMs);
    if (lastActivityAtRef.current > 0 && mountedActiveRef.current) refresh();
    mountedActiveRef.current = lastActivityAtRef.current > 0;
    return () => {
      window.removeEventListener(CHUSKY_DATA_CHANGED, refreshFromWrite);
      window.removeEventListener("focus", refreshFromReturn);
      document.removeEventListener("visibilitychange", refreshFromReturn);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
}
