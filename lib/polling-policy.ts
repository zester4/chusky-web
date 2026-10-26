/**
 * Dashboard refreshes are a freshness fallback, not a transport mechanism.
 * SSE (EventSource) delivers real-time updates instantly; background polling
 * is only a safety net for when the SSE connection is disrupted. Keep these
 * intervals long to avoid unnecessary Redis reads on the server.
 */
export const DASHBOARD_REFRESH_INTERVAL_MS = 300_000; // 5 min — SSE handles real-time delivery

/** Bounded fallback while durable missions can transition; SSE fires first. */
export const ACTIVE_MISSION_REFRESH_INTERVAL_MS = 60_000; // 1 min — was 15 s

/** Stop background refreshes sooner when a dashboard has been left unattended. */
export const DASHBOARD_IDLE_TIMEOUT_MS = 60_000; // 1 min idle → pause polling (was 2 min)

/**
 * Avoid duplicate API refreshes caused by focus and visibility events firing together.
 * Refreshes on return only if away from the tab for at least 5 minutes.
 */
export const DASHBOARD_RETURN_REFRESH_COOLDOWN_MS = 300_000; // 5 min cooldown before return refresh

/** Fallback cadence used only while a run is genuinely active and SSE is unavailable. */
export const ACTIVE_RUN_RECOVERY_INTERVAL_MS = 10_000; // 10 s — was 5 s

export function shouldPollDashboard(input: { visibilityState: string; lastActivityAt: number; now: number }): boolean {
  return input.visibilityState === "visible" && input.now - input.lastActivityAt < DASHBOARD_IDLE_TIMEOUT_MS;
}

export function shouldRefreshAfterReturn(lastRefreshAt: number, now: number): boolean {
  return lastRefreshAt <= 0 || now - lastRefreshAt >= DASHBOARD_RETURN_REFRESH_COOLDOWN_MS;
}
