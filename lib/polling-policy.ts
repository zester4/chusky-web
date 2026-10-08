/**
 * Dashboard refreshes are a freshness fallback, not a transport mechanism.
 * Successful writes and visibility/focus events already trigger immediate
 * refreshes through useLiveData, so background polling stays bounded.
 */
export const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;

/** Stop background refreshes when a dashboard has been left unattended. */
export const DASHBOARD_IDLE_TIMEOUT_MS = 120_000;

/** Avoid duplicate API refreshes caused by focus and visibility events firing together. */
export const DASHBOARD_RETURN_REFRESH_COOLDOWN_MS = 15_000;

/** Fallback cadence used only while a run is genuinely active. */
export const ACTIVE_RUN_RECOVERY_INTERVAL_MS = 5_000;

export function shouldPollDashboard(input: { visibilityState: string; lastActivityAt: number; now: number }): boolean {
  return input.visibilityState === "visible" && input.now - input.lastActivityAt < DASHBOARD_IDLE_TIMEOUT_MS;
}

export function shouldRefreshAfterReturn(lastRefreshAt: number, now: number): boolean {
  return lastRefreshAt <= 0 || now - lastRefreshAt >= DASHBOARD_RETURN_REFRESH_COOLDOWN_MS;
}
