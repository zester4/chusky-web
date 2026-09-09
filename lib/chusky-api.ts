export type Page<T> = { data: T[]; nextCursor?: string };
export type Thread = { id: string; externalId?: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string };
export type UploadedFile = { id: string; name: string; contentType: string; size: number; status: "pending" | "available" | "rejected"; createdAt: number; downloadUrl?: string; expiresAt?: string };
export type UploadIntent = UploadedFile & { uploadUrl: string; expiresAt: string };
export type DurationBudget = "5m" | "30m" | "1h" | "3h" | "6h" | "3d" | "1w";
export type RunBudget = { duration?: DurationBudget; maxToolCalls?: number; maxCost?: number };
export type RunToolPolicy = { allow?: string[]; deny?: string[]; requireApproval?: string[] };
export type Run = { id: string; threadId: string; status: "queued" | "running" | "requires_approval" | "completed" | "failed" | "cancelled"; input: string; model?: string; attachments?: Array<Pick<UploadedFile, "id" | "name" | "contentType" | "size">>; output?: string; taskId?: string; approvalId?: string; metadata?: Record<string, unknown>; budget?: RunBudget; tools?: RunToolPolicy; skills?: string[]; events?: Array<{ id: string; type: string; at: number; text?: string }>; error?: { code: string; message: string }; createdAt: string; updatedAt: string };
export type RunStreamEvent =
  | { type: "run.queued"; run: Run }
  | { type: "run.started"; run: Run }
  | { type: "run.delta"; runId: string; text: string }
  | { type: "run.tool_started"; runId: string; toolSlug: string }
  | { type: "run.approval_required"; run: Run; approval?: Approval }
  | { type: "run.completed"; run: Run }
  | { type: "run.failed"; run: Run; error: { code: string; message: string } }
  | { type: "run.cancelled"; run: Run };
export type Task = { id: string; status: "queued" | "running" | "blocked" | "completed" | "failed" | "cancelled"; title: string; objective: string; checkpoint?: string; nextAction?: string; result?: string; error?: string; attempt?: number; maxAttempts?: number; sdkRunId?: string; sdkThreadId?: string; sdkBudget?: RunBudget; sdkModel?: string; sdkSkills?: string[]; events?: Array<{ id: string; type: string; message: string; at: number; attempt: number }>; createdAt: string; updatedAt: string };
export type Usage = { messages: number; cost: number; files: { count: number; declaredBytes: number; available: number }; runs: { count: number; active: number }; tasks: { count: number } };
export type Approval = { id: string; status?: "pending" | "approved" | "denied" | "consumed"; toolSlug: string; args: Record<string, unknown>; request?: string; channelProvider?: string; handoffId?: string; expiresAt: string };
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
export type Tool = { slug: string; description: string; source: "native" | "composio"; approval?: "auto" | "approval_required"; toolkit?: string; connected?: boolean };
export type Skill = { name: string; description: string; path: string; bytes?: number; updatedAt?: number | string; files?: number };
export type SkillFile = { name?: string; path: string; bytes: number; binary: boolean; content?: string; truncated?: boolean };
export type Artifact = { id: string; name: string; type: "website" | "report" | "docx" | "presentation" | "pdf" | "spreadsheet" | "image" | "video" | "zip" | "project"; path: string; contentType: string; size: number; status: "available"; sandboxId: string; createdAt: string; updatedAt: string; downloadUrl?: string };
export type VideoJob = { id: string; prompt: string; destination: "telegram" | "daytona" | "both"; workspacePath?: string; workflowRunId?: string; status: "queued" | "running" | "completed" | "failed" | "cancelled"; pollCount: number; error?: string; resultPath?: string; createdAt: string; updatedAt: string; completedAt?: string };
export type Worker = { id: string; worker: string; from: string; objective: string; expectedOutput: string; status: string; taskId?: string; workflowRunId?: string; timestamp: string; delegation?: Record<string, unknown>; context?: Record<string, unknown> };
export type ChannelConnection = { provider: string; externalUserId: string; workspaceId?: string; displayName?: string; verifiedAt: string; proactiveOptIn: boolean };
export type Delivery = { id: string; provider: string; status: string; kind: string; attempts: number; providerStatus?: string; lastError?: string; createdAt: string; updatedAt: string; deliveredAt?: string };
export type Webhook = { id: string; url: string; createdAt: string; disabledAt?: string };
export type Reminder = { id: string; text: string; runAt: string; status: string; createdAt: string; deliveryError?: string };
export type Job = { id: string; text: string; cron: string; status: "active" | "cancelled"; scheduleId?: string; createdAt: string; deliveryError?: string };
export type MemoryFact = { id: string; category: string; key: string; value: string; confidence: number; source?: string; sensitivity?: string; createdAt: string; updatedAt: string; expiresAt?: string; reviewAt?: string };
export type ScratchpadNote = { key: string; content: string; updatedAt: string };

// Browser requests stay on the frontend origin and are proxied by Next.js to
// Chusky. This keeps Better Auth's session cookie first-party on Vercel.
const apiBaseURL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_AUTH_URL || (process.env.NODE_ENV === "production" ? "https://chusky.up.railway.app" : "http://localhost:8080")).replace(/\/+$/, "")
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
type PageOptions = { limit?: number; cursor?: string };
const pageQuery = ({ limit, cursor }: PageOptions = {}) => {
  const query = new URLSearchParams();
  if (limit !== undefined) query.set("limit", String(limit));
  if (cursor) query.set("cursor", cursor);
  const value = query.toString();
  return value ? `?${value}` : "";
};

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

async function requestBytes(path: string): Promise<Blob> {
  const response = await fetch(`${apiBaseURL}/v1${path}`, { credentials: "include", headers: { Accept: "application/octet-stream" } });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string; code?: string } } | undefined;
    throw new ChuskyApiError(response.status, body?.error?.message || `Chusky returned HTTP ${response.status}`, body?.error?.code);
  }
  return response.blob();
}

export const chuskyApi = {
  threads: {
    list: (options: PageOptions = {}) => request<Page<Thread>>(`/threads${pageQuery(options)}`),
    create: (metadata: Record<string, unknown> = {}) => request<Thread>("/threads", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ metadata }) }),
    get: (threadId: string) => request<Thread>(`/threads/${encodeURIComponent(threadId)}`),
    runs: (threadId: string, options: PageOptions = {}) => request<Page<Run>>(`/threads/${encodeURIComponent(threadId)}/runs${pageQuery(options)}`),
    update: (threadId: string, input: { title?: string; archived?: boolean }) => request<Thread>(`/threads/${encodeURIComponent(threadId)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency(), "Content-Type": "application/json" }, body: JSON.stringify(input) }),
    remove: (threadId: string) => request<void>(`/threads/${encodeURIComponent(threadId)}`, { method: "DELETE" }),
  },
  runs: {
    create: (threadId: string, input: { input: string; model?: string; metadata?: Record<string, unknown>; attachments?: string[]; budget?: RunBudget; tools?: RunToolPolicy; skills?: string[]; wait?: boolean }) => request<Run>(`/threads/${encodeURIComponent(threadId)}/runs`, { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    get: (threadId: string, runId: string) => request<Run>(`/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}`),
    events: (threadId: string, runId: string, after = 0) => request<{ data: Array<{ id: string; type: string; at: number; text?: string }> }>(`/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}/events?after=${after}`),
    cancel: (threadId: string, runId: string) => request<Run>(`/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}/cancel`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    resume: (threadId: string, runId: string) => request<Run>(`/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}/resume`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    async *stream(threadId: string, input: string, attachments: string[] = [], signal?: AbortSignal, options: { model?: string; budget?: RunBudget; tools?: RunToolPolicy; skills?: string[] } = {}): AsyncIterable<RunStreamEvent> {
      const response = await fetch(`${apiBaseURL}/v1/threads/${encodeURIComponent(threadId)}/runs/stream`, { method: "POST", credentials: "include", signal, headers: { Accept: "application/x-ndjson", "Content-Type": "application/json", "Idempotency-Key": idempotency() }, body: JSON.stringify({ input, attachments, ...options }) });
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
    get: (fileId: string) => request<UploadedFile>(`/files/${encodeURIComponent(fileId)}`),
    async upload(file: File, onProgress?: (progress: number) => void): Promise<UploadedFile> {
      const intent = await this.create(file);
      await putUpload(intent.uploadUrl, file, onProgress);
      await this.complete(intent.id);
      return request<UploadedFile>(`/files/${encodeURIComponent(intent.id)}`);
    },
  },
  tasks: {
    list: () => request<Page<Task>>("/tasks"),
    get: (taskId: string) => request<Task>(`/tasks/${encodeURIComponent(taskId)}`),
    retry: (taskId: string) => request<Task>(`/tasks/${encodeURIComponent(taskId)}/retry`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    cancel: (taskId: string) => request<Task>(`/tasks/${encodeURIComponent(taskId)}/cancel`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
  },
  approvals: {
    list: () => request<{ data: Approval[] }>("/approvals"),
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
  tools: {
    list: (query = "", source?: "native" | "composio", toolkit?: string) => { const params = new URLSearchParams(); if (query) params.set("query", query); if (source) params.set("source", source); if (toolkit) params.set("toolkit", toolkit); return request<{ data: Tool[] }>(`/tools${params.size ? `?${params.toString()}` : ""}`); },
    get: (slug: string) => request<Tool>(`/tools/${encodeURIComponent(slug)}`),
  },
  skills: {
    list: (query = "", limit = 50) => request<{ data: Skill[] }>(`/skills?limit=${limit}${query ? `&query=${encodeURIComponent(query)}` : ""}`),
    files: (name: string) => request<{ data: SkillFile[] }>(`/skills/${encodeURIComponent(name)}/files`),
    read: (name: string, path = "SKILL.md", maxChars = 12000) => request<SkillFile>(`/skills/${encodeURIComponent(name)}/files/read?path=${encodeURIComponent(path)}&maxChars=${maxChars}`),
  },
  artifacts: {
    list: (type?: Artifact["type"]) => request<Page<Artifact>>(`/artifacts${type ? `?type=${encodeURIComponent(type)}` : ""}`),
    get: (id: string) => request<Artifact>(`/artifacts/${encodeURIComponent(id)}`),
    download: (id: string) => requestBytes(`/artifacts/${encodeURIComponent(id)}/download`),
    remove: (id: string) => request<void>(`/artifacts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  videos: {
    list: () => request<{ data: VideoJob[] }>("/videos"),
    create: (input: { prompt: string; destination?: VideoJob["destination"]; workspacePath?: string; duration?: string; aspectRatio?: string; resolution?: string; generateAudio?: boolean }) => request<VideoJob>("/videos", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    get: (id: string) => request<VideoJob>(`/videos/${encodeURIComponent(id)}`),
    cancel: (id: string) => request<VideoJob>(`/videos/${encodeURIComponent(id)}/cancel`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
  },
  workers: {
    list: (status?: string) => request<{ data: Worker[] }>(`/workers${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    create: (input: { worker: string; objective: string; expectedOutput?: string; model?: string; allowedTools?: string[]; allowedComposioTools?: string[]; approvalPolicy?: "auto" | "require_chusky_approval"; duration?: DurationBudget; timeoutSeconds?: number; maxToolCalls?: number; budgetSeconds?: number }) => request<Worker>("/workers", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    get: (id: string) => request<Worker>(`/workers/${encodeURIComponent(id)}`),
    cancel: (id: string) => request<Worker>(`/workers/${encodeURIComponent(id)}/cancel`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
  },
  channels: { list: () => request<{ data: ChannelConnection[] }>("/channels") },
  deliveries: { list: () => request<{ data: Delivery[] }>("/deliveries") },
  webhooks: {
    list: () => request<{ data: Webhook[] }>("/webhooks"),
    create: (url: string) => request<Webhook & { secret?: string }>("/webhooks", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ url }) }),
    setEnabled: (id: string, enabled: boolean) => request<Webhook>(`/webhooks/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ enabled }) }),
    remove: (id: string) => request<void>(`/webhooks/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
  reminders: {
    list: () => request<{ data: Reminder[] }>("/reminders"),
    create: (input: { text: string; delaySeconds?: number; runAt?: string }) => request<Reminder>("/reminders", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    cancel: (id: string) => request<void>(`/reminders/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
  jobs: {
    list: () => request<{ data: Job[] }>("/jobs"),
    create: (input: { text: string; cron: string }) => request<Job>("/jobs", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    cancel: (id: string) => request<void>(`/jobs/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
  memory: {
    list: (query = "") => request<{ data: MemoryFact[] }>(`/memory${query ? `?query=${encodeURIComponent(query)}` : ""}`),
    save: (input: { category: string; key: string; value: string; confidence?: number; sensitivity?: string; projectId?: string; personKey?: string }) => request<MemoryFact>("/memory", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/memory/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
  scratchpad: {
    list: (query = "") => request<{ data: ScratchpadNote[] }>(`/scratchpad${query ? `?query=${encodeURIComponent(query)}` : ""}`),
    save: (key: string, content: string) => request<ScratchpadNote>(`/scratchpad/${encodeURIComponent(key)}`, { method: "PUT", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ content }) }),
    remove: (key?: string) => request<void>(`/scratchpad${key ? `?key=${encodeURIComponent(key)}` : ""}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
};
