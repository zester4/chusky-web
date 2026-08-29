export type Page<T> = { data: T[]; nextCursor?: string };
export type Thread = { id: string; externalId?: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string };
export type Run = { id: string; threadId: string; status: "queued" | "running" | "requires_approval" | "completed" | "failed" | "cancelled"; input: string; output?: string; approvalId?: string; error?: { code: string; message: string }; createdAt: string; updatedAt: string };
export type RunStreamEvent =
  | { type: "run.started"; run: Run }
  | { type: "run.delta"; runId: string; text: string }
  | { type: "run.tool_started"; runId: string; toolSlug: string }
  | { type: "run.approval_required"; run: Run; approval: { id: string; toolSlug: string; args: Record<string, unknown>; expiresAt: string } }
  | { type: "run.completed"; run: Run }
  | { type: "run.failed"; run: Run; error: { code: string; message: string } }
  | { type: "run.cancelled"; run: Run };
export type Task = { id: string; status: string; title: string; objective: string; checkpoint?: string; nextAction?: string; result?: string; error?: string; createdAt: string; updatedAt: string };
export type Usage = { messages: number; cost: number; files: { count: number; declaredBytes: number; available: number }; runs: { count: number; active: number }; tasks: { count: number } };
export type Approval = { id: string; toolSlug: string; args: Record<string, unknown>; expiresAt: string };

const apiBaseURL = (process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080").replace(/\/+$/, "");

export class ChuskyApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) { super(message); this.name = "ChuskyApiError"; }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseURL}/v1${path}`, { ...init, credentials: "include", headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string; code?: string } } | undefined;
    throw new ChuskyApiError(response.status, body?.error?.message || `Chusky returned HTTP ${response.status}`, body?.error?.code);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

const idempotency = () => crypto.randomUUID();

export const chuskyApi = {
  threads: {
    list: () => request<Page<Thread>>("/threads"),
    create: (metadata: Record<string, unknown> = {}) => request<Thread>("/threads", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ metadata }) }),
  },
  runs: {
    async *stream(threadId: string, input: string, signal?: AbortSignal): AsyncIterable<RunStreamEvent> {
      const response = await fetch(`${apiBaseURL}/v1/threads/${encodeURIComponent(threadId)}/runs/stream`, { method: "POST", credentials: "include", signal, headers: { Accept: "application/x-ndjson", "Content-Type": "application/json", "Idempotency-Key": idempotency() }, body: JSON.stringify({ input }) });
      if (!response.ok) {
        const body = await response.json().catch(() => undefined) as { error?: { message?: string; code?: string } } | undefined;
        throw new ChuskyApiError(response.status, body?.error?.message || `Chusky returned HTTP ${response.status}`, body?.error?.code);
      }
      if (!response.body) throw new ChuskyApiError(502, "Chusky returned an empty run stream");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = "";
      try {
        while (true) {
          const { value, done } = await reader.read(); pending += decoder.decode(value, { stream: !done });
          let newline = -1;
          while ((newline = pending.indexOf("\n")) >= 0) { const line = pending.slice(0, newline).trim(); pending = pending.slice(newline + 1); if (line) yield JSON.parse(line) as RunStreamEvent; }
          if (done) break;
        }
        if (pending.trim()) yield JSON.parse(pending.trim()) as RunStreamEvent;
      } finally { reader.releaseLock(); }
    },
  },
  tasks: { list: () => request<Page<Task>>("/tasks") },
  approvals: {
    get: (approvalId: string) => request<Approval>(`/approvals/${encodeURIComponent(approvalId)}`),
    decide: (approvalId: string, decision: "approve" | "deny") => request<Run>(`/approvals/${encodeURIComponent(approvalId)}`, { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ decision }) }),
  },
  usage: { get: () => request<Usage>("/usage") },
};
