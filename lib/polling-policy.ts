/**
 * Dashboard refreshes are a freshness fallback, not a transport mechanism.
 * Successful writes and visibility/focus events already trigger immediate
 * refreshes through useLiveData, so background polling stays bounded.
 */
export const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;

/** Fallback cadence used only while a run is genuinely active. */
export const ACTIVE_RUN_RECOVERY_INTERVAL_MS = 5_000;
