export interface BuilderAccess { name: string; role: "builder_admin" | "builder_viewer"; permissions: string[]; mfaEnabled: boolean; verified: boolean; fresh: boolean }
export interface BuilderControl { version: number; agentEnabled: boolean; changedAt?: number }
export interface BuilderPerson { id: string; name: string; email: string; emailVerified: boolean; createdAt: string | null; role: string; banned: boolean }
export interface BuilderOverview {
  observedAt: number; scope: string; uptimeSeconds: number; persistence: string;
  neon: { enabled: boolean; reachable: boolean; schemaReady: boolean };
  storage: Record<string, number> | null;
  monitoring: { counters: Record<string, number>; lastFailure: { at: string; type?: string } | null };
  providers: Array<{ name: string; configured: boolean }>;
}
export interface BuilderAudit { id: string; actorId: string; action: string; at: number; enabled?: boolean; reason?: string; version?: number; targetUserId?: string }
export class BuilderApiError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) { super(message); }
}
export async function builderRequest<T>(path: string, body?: unknown, method = "GET"): Promise<T> {
  const response = await fetch(`/builder/v1/${path}`, { method, credentials: "include", cache: "no-store", signal: AbortSignal.timeout(15000), ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new BuilderApiError(value?.error?.code || "unavailable", response.status, value?.error?.message || "The control plane could not be reached.");
  return value as T;
}
