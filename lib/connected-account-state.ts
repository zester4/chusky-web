export const ACTIVE_CONNECTED_ACCOUNT_STATUSES = new Set(["ACTIVE", "CONNECTED", "ENABLED"]);

export function isUsableConnectedAccount(status: string | undefined): boolean {
  return !status || ACTIVE_CONNECTED_ACCOUNT_STATUSES.has(status.trim().toUpperCase());
}

export function connectedAccountStatusLabel(status: string | undefined): string {
  const normalized = status?.trim().toUpperCase();
  if (!normalized) return "Active";
  if (normalized === "ACTIVE" || normalized === "CONNECTED" || normalized === "ENABLED") return "Active";
  if (normalized === "EXPIRED") return "Expired";
  if (normalized === "REVOKED") return "Revoked";
  if (normalized === "DISABLED") return "Disabled";
  if (normalized === "INACTIVE") return "Inactive";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export function connectedAppSummary(accounts: readonly { status: string }[], loaded: boolean): { label: string; tone: "green" | "amber" | "gray" } {
  if (!loaded) return { label: "Checking connection…", tone: "gray" };
  const active = accounts.filter((account) => isUsableConnectedAccount(account.status)).length;
  const unavailable = accounts.length - active;
  if (active && unavailable) return { label: `${active} connected · ${unavailable} needs reconnection`, tone: "amber" };
  if (active) return { label: `${active} connected`, tone: "green" };
  if (unavailable === 1) return { label: "Needs reconnection", tone: "amber" };
  if (unavailable > 1) return { label: `${unavailable} need reconnection`, tone: "amber" };
  return { label: "Not connected", tone: "gray" };
}
