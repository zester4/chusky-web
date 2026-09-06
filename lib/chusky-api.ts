export type Page<T> = { data: T[]; nextCursor?: string };
export type Thread = { id: string; externalId?: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string };
export type UploadedFile = { id: string; name: string; contentType: string; size: number; status: "pending" | "available" | "rejected"; createdAt: number; downloadUrl?: string; expiresAt?: string };
export type UploadIntent = UploadedFile & { uploadUrl: string; expiresAt: string };
export type Run = { id: string; threadId: string; status: "queued" | "running" | "requires_approval" | "completed" | "failed" | "cancelled"; input: string; attachments?: Array<Pick<UploadedFile, "id" | "name" | "contentType" | "size">>; output?: string; approvalId?: string; error?: { code: string; message: string }; createdAt: string; updatedAt: string };
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
export type CallRecord = { id: string; provider: "twilio" | "facetime"; direction: "inbound" | "outbound"; phoneNumber: string; purpose: string; status: "starting" | "bridging" | "active" | "ended" | "failed"; error?: string; createdAt: string; updatedAt: string };
export type CallApproval = { id: string; toolSlug: "CHUCK_START_PHONE_CALL"; args: { phoneNumber: string; purpose: string }; status: "pending"; expiresAt: string };
export type DeveloperProject = { id: string; name: string; keyPrefix: string; scopes: string[]; createdAt: string; rotatedAt?: string; revokedAt?: string };
export type CreatedDeveloperProject = DeveloperProject & { key: string };
export type Activity = { now: number; approvals: Approval[]; tasks: Task[]; reminders: Array<{ id: string; text: string; createdAt: number }>; jobs: Array<{ id: string; text: string; cron: string; createdAt: number }> };
export type HealthSnapshot = { ok: boolean; status: "operational" | "degraded"; persistence: "redis" | "memory"; checks: Record<string, string>; channels: Record<string, boolean>; monitoring: { counters: Record<string, number>; lastFailure: { at: string; type?: string; message?: string } | null } };
export type AccountOverview = {
  model: string; voiceReplies: boolean;
  approvals: Array<{ id: string; toolSlug: string; request: string; status: string; channelProvider?: string; createdAt: string; expiresAt: string }>;
  channels: Array<{ provider: string; externalUserId: string; workspaceId?: string; displayName?: string; verifiedAt: string; proactiveOptIn: boolean }>;
  reminders: Array<{ id: string; text: string; runAt: string; status: string; createdAt: string }>;
  jobs: Array<{ id: string; text: string; cron: string; status: string; createdAt: string }>;
  memory: Array<{ id: string; category: string; key: string; value: string; confidence: number; updatedAt: string }>;
  scratchpad: Array<{ key: string; content: string; updatedAt: string }>;
  triggers: string[];
  devices: Array<{ name: string; createdAt: string; lastSeenAt: string }>;
  workspace: { sandboxId: string; name: string; lastKnownState?: string; createdAt: string; updatedAt: string; ptySessions: number; lastUrl?: string } | null;
  webhooks: Array<{ id: string; url: string; createdAt: string }>;
  telegramLink: { linked: boolean };
  deliveries: Array<{ id: string; provider: string; status: string; kind: string; attempts: number; providerStatus?: string; lastError?: string; createdAt: string; updatedAt: string; deliveredAt?: string }>;
};
export type TelegramLinkCode = { code: string; expiresAt: string };
export type Model = { id: string; name: string };
export type Toolkit = { slug: string; name: string; connected: boolean; logo?: string };
export type Trigger = { id: string; slug: string; status: string; config: Record<string, unknown> };

// Browser requests stay on the frontend origin and are proxied by Next.js to
// Chusky. This keeps Better Auth's session cookie first-party on Vercel.
const apiBaseURL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080").replace(/\/+$/, "")
  : window.location.origin;

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

function putUpload(url: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100)); };
    xhr.onerror = () => reject(new Error("The upload could not reach object storage. Check the R2 CORS configuration and try again."));
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Object storage returned HTTP ${xhr.status}.`));
    xhr.send(file);
  });
}

export const chuskyApi = {
  threads: {
    list: () => request<Page<Thread>>("/threads"),
    create: (metadata: Record<string, unknown> = {}) => request<Thread>("/threads", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ metadata }) }),
    get: (threadId: string) => request<Thread>(`/threads/${encodeURIComponent(threadId)}`),
    runs: (threadId: string) => request<Page<Run>>(`/threads/${encodeURIComponent(threadId)}/runs`),
    update: (threadId: string, input: { title?: string; archived?: boolean }) => request<Thread>(`/threads/${encodeURIComponent(threadId)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency(), "Content-Type": "application/json" }, body: JSON.stringify(input) }),
    remove: (threadId: string) => request<void>(`/threads/${encodeURIComponent(threadId)}`, { method: "DELETE" }),
  },
  runs: {
    async *stream(threadId: string, input: string, attachments: string[] = [], signal?: AbortSignal): AsyncIterable<RunStreamEvent> {
      const response = await fetch(`${apiBaseURL}/v1/threads/${encodeURIComponent(threadId)}/runs/stream`, { method: "POST", credentials: "include", signal, headers: { Accept: "application/x-ndjson", "Content-Type": "application/json", "Idempotency-Key": idempotency() }, body: JSON.stringify({ input, attachments }) });
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
  files: {
    create: (file: File) => request<UploadIntent>("/files", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size }) }),
    complete: (fileId: string) => request<UploadedFile>(`/files/${encodeURIComponent(fileId)}/complete`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    remove: (fileId: string) => request<void>(`/files/${encodeURIComponent(fileId)}`, { method: "DELETE" }),
    async upload(file: File, onProgress?: (progress: number) => void): Promise<UploadedFile> {
      const intent = await this.create(file);
      await putUpload(intent.uploadUrl, file, onProgress);
      return this.complete(intent.id);
    },
  },
  tasks: {
    list: () => request<Page<Task>>("/tasks"),
    get: (taskId: string) => request<Task>(`/tasks/${encodeURIComponent(taskId)}`),
    retry: (taskId: string) => request<Task>(`/tasks/${encodeURIComponent(taskId)}/retry`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    cancel: (taskId: string) => request<Task>(`/tasks/${encodeURIComponent(taskId)}/cancel`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
  },
  approvals: {
    get: (approvalId: string) => request<Approval>(`/approvals/${encodeURIComponent(approvalId)}`),
    decide: (approvalId: string, decision: "approve" | "deny") => request<Run>(`/approvals/${encodeURIComponent(approvalId)}`, { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ decision }) }),
  },
  usage: { get: () => request<Usage>("/usage") },
  activity: { get: (since = 0) => request<Activity>(`/activity?since=${since}`) },
  health: { get: () => request<HealthSnapshot>("/ops/health") },
  account: {
    get: () => request<AccountOverview>("/account/overview"),
    createTelegramLink: () => request<TelegramLinkCode>("/account/telegram-link", { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    models: () => request<Page<Model>>("/account/models"),
    updatePreferences: (input: { model?: string; voiceReplies?: boolean }) => request<{ model: string; voiceReplies: boolean }>("/account/preferences", { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    calls: {
      list: () => request<{ available: boolean; data: CallRecord[] }>("/account/calls"),
      request: (input: { phoneNumber: string; purpose: string }) => request<CallApproval>("/account/calls", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    },
    projects: {
      list: () => request<Page<DeveloperProject>>("/account/projects"),
      create: (input: { name: string; scopes?: string[] }) => request<CreatedDeveloperProject>("/account/projects", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
      updateScopes: (projectId: string, scopes: string[]) => request<DeveloperProject>(`/account/projects/${encodeURIComponent(projectId)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ scopes }) }),
      rotate: (projectId: string) => request<CreatedDeveloperProject>(`/account/projects/${encodeURIComponent(projectId)}/rotate-key`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
      revoke: (projectId: string) => request<void>(`/account/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }),
    },
  },
  apps: {
    list: () => request<Page<Toolkit>>("/apps"),
    connect: (toolkit: string) => request<{ toolkit: string; url: string }>(`/apps/${encodeURIComponent(toolkit)}/connect`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
  },
  triggers: {
    list: () => request<Page<Trigger>>("/triggers"),
    create: (slug: string, triggerConfig: Record<string, unknown> = {}) => request<Trigger>("/triggers", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ slug, triggerConfig }) }),
    setEnabled: (id: string, enabled: boolean) => request<unknown>(`/triggers/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ enabled }) }),
    remove: (id: string) => request<void>(`/triggers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
};
