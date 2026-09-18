export type Page<T> = { data: T[]; nextCursor?: string };
export type Thread = { id: string; externalId?: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string };
export type UploadedFile = { id: string; name: string; contentType: string; size: number; status: "pending" | "available" | "rejected"; createdAt: number; downloadUrl?: string; expiresAt?: string };
export type UploadIntent = UploadedFile & { uploadUrl: string; expiresAt: string };
export type DurationBudget = "5m" | "30m" | "1h" | "3h" | "6h" | "3d" | "1w";
export type RunBudget = { duration?: DurationBudget; maxToolCalls?: number; maxCost?: number };
export type RunToolPolicy = { allow?: string[]; deny?: string[]; requireApproval?: string[] };
export type Run = { id: string; threadId: string; status: "queued" | "running" | "requires_approval" | "completed" | "failed" | "cancelled"; input: string; model?: string; attachments?: Array<Pick<UploadedFile, "id" | "name" | "contentType" | "size">>; output?: string; cost?: number; taskId?: string; approvalId?: string; metadata?: Record<string, unknown>; budget?: RunBudget; tools?: RunToolPolicy; skills?: string[]; events?: Array<{ id: string; type: string; at: number; text?: string }>; error?: { code: string; message: string }; createdAt: string; updatedAt: string };
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
export type Approval = { id: string; status?: "pending" | "approved" | "denied" | "consumed"; toolSlug: string; args: Record<string, unknown>; request?: string; channelProvider?: string; handoffId?: string; createdAt?: string; expiresAt: string };
export type ApprovalDecision = { id: string; status: "denied" | "consumed"; text?: string };
export type CallRecord = { id: string; provider: "legacy" | "twilio" | "bland"; direction: "inbound" | "outbound"; phoneNumber: string; purpose: string; status: "starting" | "bridging" | "active" | "ended" | "failed"; summary?: string; error?: string; createdAt: string; updatedAt: string };
export type CallMode = "general" | "sales" | "onboarding" | "support" | "scheduling";
export type CallTone = "professional" | "warm" | "direct" | "consultative";
export type CallCapability = "memory_lookup" | "scratchpad_lookup" | "schedule_lookup" | "task_lookup" | "call_history";
export type CallProfile = { identity: string; organization?: string; mode: CallMode; tone: CallTone; opening?: string; facts: string[]; guardrails: string[]; capabilities: CallCapability[] };
export type CallApproval = { id: string; toolSlug: "CHUCK_START_PHONE_CALL"; args: { phoneNumber: string; purpose: string; profile: CallProfile }; status: "pending"; expiresAt: string };
export type DeveloperProject = { id: string; name: string; keyPrefix: string; scopes: string[]; organizationId?: string; createdAt: string; rotatedAt?: string; revokedAt?: string };
export type CreatedDeveloperProject = DeveloperProject & { key: string };
export type CompanyAgentTemplate = { slug: string; name: string; outcome: string; allowedTools: string[]; requireApproval: string[] };
export type CompanyAgent = { id: string; name: string; template: string; instructions: string; tools: RunToolPolicy; budget: RunBudget; createdAt: string; updatedAt: string };
export type CompanyPolicy = { tools?: RunToolPolicy; budget?: RunBudget };
export type CompanyRun = { id: string; status: Run["status"]; agentId?: string; agentName?: string; cost?: number; errorCode?: string; createdAt: string; updatedAt: string };
export type CompanyAuditEvent = { id: string; requestId: string; action: string; status: number; at: string };
export type CompanyUsagePeriod = { month: string; completedRuns: number; costUsd: number };
export type CompanyUsage = { currentMonth: CompanyUsagePeriod; periods: CompanyUsagePeriod[]; runs: { indexed: number; active: number } };
export type CompanyBranding = { organizationId: string; displayName: string; logoUrl?: string; accentColor: string; backgroundColor: string; customDomain?: string; customDomainStatus: "not_configured" | "pending_dns"; updatedAt?: string };
export type Activity = { now: number; approvals: Approval[]; tasks: Task[]; reminders: Array<{ id: string; text: string; createdAt: number }>; jobs: Array<{ id: string; text: string; cron: string; createdAt: number }> };
export type HealthSnapshot = { ok: boolean; status: "operational" | "degraded"; persistence: "redis" | "memory"; checks: Record<string, string>; channels: Record<string, boolean>; monitoring: { counters: Record<string, number>; lastFailure: { at: string; type?: string; message?: string } | null } };
export type AccountOverview = {
  model: string; voiceReplies: boolean; voicePreferences: LiveVoicePreferences;
  approvals: Array<{ id: string; toolSlug: string; request: string; status: string; channelProvider?: string; createdAt: string; expiresAt: string }>;
  channels: Array<{ id: string; provider: string; externalUserId: string; workspaceId?: string; displayName?: string; verifiedAt: string; proactiveOptIn: boolean }>;
  reminders: Array<{ id: string; text: string; runAt: string; status: string; createdAt: string }>;
  jobs: Array<{ id: string; text: string; cron: string; status: string; createdAt: string }>;
  memory: Array<{ id: string; category: string; key: string; value: string; confidence: number; updatedAt: string }>;
  scratchpad: Array<{ key: string; content: string; updatedAt: string }>;
  triggers: string[];
  devices: Array<{ id: string; name: string; createdAt: string; lastSeenAt: string }>;
  workspace: { sandboxId: string; name: string; lastKnownState?: string; createdAt: string; updatedAt: string; ptySessions: number; lastUrl?: string } | null;
  webhooks: Array<{ id: string; url: string; createdAt: string }>;
  telegramLink: { linked: boolean };
  deliveries: Array<{ id: string; provider: string; status: string; kind: string; attempts: number; providerStatus?: string; lastError?: string; createdAt: string; updatedAt: string; deliveredAt?: string }>;
};
export type FluxVoice = { id: string; name: string; accent: string };
export type BlandVoice = { id: string; name: string; description?: string };
export type LiveVoicePreferences = { twilio?: string; meetings?: string; bland?: { id: string; name: string } };
export type VoiceOptions = { fluxVoices: FluxVoice[]; blandVoices: BlandVoice[]; blandAvailable: boolean; blandCatalogueAvailable: boolean };
export type VoiceSettings = { model: string; voiceReplies: boolean; voicePreferences: LiveVoicePreferences };
export type TelegramLinkCode = { code: string; expiresAt: string };
export type Model = { id: string; name: string };
export type Toolkit = { slug: string; name: string; connected: boolean; logo?: string; accountCount?: number; aliases?: string[] };
export type ConnectedAccount = { id: string; alias?: string; toolkit: string; status: string; createdAt?: string; updatedAt?: string };
export type Trigger = { id: string; slug: string; status: string; config: Record<string, unknown> };
export type TriggerCatalogueItem = { token: string; slug: string; name: string; description: string; instructions?: string; toolkit: { slug: string; name: string; logo?: string }; config: Record<string, unknown> };
export type TriggerToolkit = { slug: string; name: string; logo?: string; triggerCount: number; connected: boolean; accountCount: number };
export type McpCatalogEntry = { id: string; name: string; url: string; auth: "none" | "bearer" | "oauth"; scopes?: string[]; enabled?: boolean; allowedTools?: string[]; requireApproval?: boolean };
export type McpConnection = { serverId: string; name: string; auth: "none" | "bearer" | "oauth"; enabled: boolean; connectedAt: string; updatedAt: string };
export type Tool = { slug: string; description: string; source: "native" | "composio"; approval?: "auto" | "approval_required"; toolkit?: string; connected?: boolean };
export type Skill = { name: string; description: string; path: string; bytes?: number; updatedAt?: number | string; files?: number };
export type SkillFile = { name?: string; path: string; bytes: number; binary: boolean; content?: string; truncated?: boolean };
export type Artifact = { id: string; name: string; type: "website" | "report" | "docx" | "presentation" | "pdf" | "spreadsheet" | "image" | "video" | "zip" | "project"; path: string; contentType: string; size: number; status: "available"; sandboxId: string; createdAt: string; updatedAt: string; downloadUrl?: string };
export type VideoJob = { id: string; prompt: string; destination: "telegram" | "daytona" | "both"; workspacePath?: string; workflowRunId?: string; status: "queued" | "running" | "completed" | "failed" | "cancelled"; pollCount: number; error?: string; resultPath?: string; createdAt: string; updatedAt: string; completedAt?: string };
export type Worker = { id: string; worker: string; from: string; objective: string; expectedOutput: string; status: string; taskId?: string; workflowRunId?: string; timestamp: string; delegation?: Record<string, unknown>; context?: Record<string, unknown> };
export type ChannelConnection = { id: string; provider: string; externalUserId: string; workspaceId?: string; displayName?: string; verifiedAt: string; proactiveOptIn: boolean };
export type ChannelLinkCode = { provider: string; code: string; expiresInSeconds: number; instructions: string; installUrl?: string };
export type MeetingRepresentativeRole = "sales" | "client_onboarding" | "employee_onboarding" | "customer_success" | "custom";
export type MeetingRepresentativeProfile = { enabled: boolean; representativeName: string; organizationName: string; role: MeetingRepresentativeRole; objective: string; communicationStyle: string; approvedKnowledge: string; authorityBoundaries: string; allowedComposioTools: string[]; composioAccountAliases: Record<string, string>; allowedNativeTools: string[]; allowMeetingScheduling: boolean; autoJoinCalendar: boolean; updatedAt: number; autoJoinReconciliation?: { cancelled: number; stillInCall: number; failures: number } };
export type CalendarPreparation = { id: string; sourceTriggerEventId: string; calendarEventId?: string; lifecycle: "created" | "updated" | "sync" | "starting_soon" | "attendee_response" | "cancelled"; status: "prepared" | "auto_scheduled" | "cancelled" | "joined" | "expired"; title?: string; startAt?: string; endAt?: string; participants: string[]; meetingUrlAvailable: boolean; brief?: string; briefStatus?: string; createdAt: string; updatedAt: string };
export type Meeting = { id: string; platform: string; interactionMode: "addressed" | "copilot" | "representative"; status: string; title?: string; joinAt?: string; error?: string; providerStatusAt?: string; participantRoster: Array<{ id: string; name: string; isHost?: boolean; status: "present" | "left"; updatedAt: string }>; speakerEvents: Array<{ type: "speech_on" | "speech_off"; participantId?: string; at: string }>; history: Array<{ role: "user" | "assistant"; content: string; createdAt?: string }>; outcome?: { title: string; summary: string; decisions: string[]; actionItems: Array<{ task: string; owner: string; dueDate?: string }>; openQuestions: string[] }; outcomeFollowThrough?: { notionSaved?: boolean; notionTool?: string; notionUrl?: string; completedTools?: string[] }; outcomeStatus?: "pending" | "completed"; outcomeNotificationStatus?: string; createdAt: string; updatedAt: string };
export type MeetingContact = { id: string; meetingId: string; participantName: string; email?: string; phone?: string; contactPreference: "email" | "phone" | "unspecified"; interest: string; nextStep?: string; followUpAt?: string; followUpTaskId?: string; createdAt: string; updatedAt: string };
export type MeetingWorkspace = { preparations: CalendarPreparation[]; meetings: Meeting[]; contacts: MeetingContact[] };
export type Delivery = { id: string; provider: string; status: string; kind: string; attempts: number; providerStatus?: string; lastError?: string; createdAt: string; updatedAt: string; deliveredAt?: string };
export type Webhook = { id: string; url: string; createdAt: string; disabledAt?: string };
export type Reminder = { id: string; text: string; runAt: string; status: string; createdAt: string; deliveryError?: string };
export type Job = { id: string; text: string; cron: string; status: "active" | "cancelled"; scheduleId?: string; createdAt: string; deliveryError?: string };
export type MemoryFact = { id: string; category: string; key: string; value: string; confidence: number; source?: string; sensitivity: "normal" | "sensitive"; createdAt: string; updatedAt: string; expiresAt?: string; reviewAt?: string };
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

async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseURL}${path}`, { credentials: "include", headers: { Accept: "application/json" } });
  if (!response.ok) throw new ChuskyApiError(response.status, `Chusky returned HTTP ${response.status}`);
  return await response.json() as T;
}

const idempotency = () => crypto.randomUUID();
type PageOptions = { limit?: number; cursor?: string; includeArchived?: boolean };
const pageQuery = ({ limit, cursor, includeArchived }: PageOptions = {}) => {
  const query = new URLSearchParams();
  if (limit !== undefined) query.set("limit", String(limit));
  if (cursor) query.set("cursor", cursor);
  if (includeArchived !== undefined) query.set("includeArchived", String(includeArchived));
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
    decide: (approvalId: string, decision: "approve" | "deny") => request<Run | ApprovalDecision>(`/approvals/${encodeURIComponent(approvalId)}`, { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ decision }) }),
  },
  usage: { get: () => request<Usage>("/usage") },
  activity: { get: (since = 0) => request<Activity>(`/activity?since=${since}`) },
  health: { get: () => request<HealthSnapshot>("/ops/health") },
  account: {
    get: () => request<AccountOverview>("/account/overview"),
    createTelegramLink: () => request<TelegramLinkCode>("/account/telegram-link", { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
    models: () => request<Page<Model>>("/account/models"),
    preferences: () => request<VoiceSettings>("/account/preferences"),
    voiceOptions: () => request<VoiceOptions>("/account/voice-options"),
    updatePreferences: (input: { model?: string; voiceReplies?: boolean; liveVoice?: { provider: "twilio" | "meetings"; voice: string | null } | { provider: "bland"; voice: { id: string; name: string } | null } }) => request<VoiceSettings>("/account/preferences", { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    calls: {
      list: () => request<{ available: boolean; provider: "twilio" | "bland" | null; data: CallRecord[] }>("/account/calls"),
      request: (input: { phoneNumber: string; purpose: string; profile: CallProfile }) => request<CallApproval>("/account/calls", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    },
    projects: {
      list: (organizationId?: string) => request<Page<DeveloperProject>>(`/account/projects${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`),
      create: (input: { name: string; scopes?: string[]; organizationId?: string }) => request<CreatedDeveloperProject>("/account/projects", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
      updateScopes: (projectId: string, scopes: string[]) => request<DeveloperProject>(`/account/projects/${encodeURIComponent(projectId)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ scopes }) }),
      rotate: (projectId: string) => request<CreatedDeveloperProject>(`/account/projects/${encodeURIComponent(projectId)}/rotate-key`, { method: "POST", headers: { "Idempotency-Key": idempotency() } }),
      revoke: (projectId: string) => request<void>(`/account/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }),
      policy: {
        get: (projectId: string) => request<{ data: CompanyPolicy }>(`/account/projects/${encodeURIComponent(projectId)}/policy`),
        update: (projectId: string, policy: CompanyPolicy) => request<{ data: CompanyPolicy }>(`/account/projects/${encodeURIComponent(projectId)}/policy`, { method: "PUT", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(policy) }),
      },
      agents: {
        list: (projectId: string) => request<{ data: CompanyAgent[] }>(`/account/projects/${encodeURIComponent(projectId)}/agents`),
        create: (projectId: string, input: { template: string; name?: string; instructions?: string }) => request<CompanyAgent>(`/account/projects/${encodeURIComponent(projectId)}/agents`, { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
        update: (projectId: string, agentId: string, input: { name?: string; instructions?: string }) => request<CompanyAgent>(`/account/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentId)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
        remove: (projectId: string, agentId: string) => request<void>(`/account/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentId)}`, { method: "DELETE" }),
      },
      telemetry: {
        runs: (projectId: string) => request<Page<CompanyRun>>(`/account/projects/${encodeURIComponent(projectId)}/company/runs?limit=20`),
        audit: (projectId: string) => request<Page<CompanyAuditEvent>>(`/account/projects/${encodeURIComponent(projectId)}/company/audit-events`),
        usage: (projectId: string) => request<CompanyUsage>(`/account/projects/${encodeURIComponent(projectId)}/company/usage`),
      },
    },
    organizations: {
      branding: {
        get: (organizationId: string) => request<{ data: CompanyBranding }>(`/account/organizations/${encodeURIComponent(organizationId)}/branding`),
        update: (organizationId: string, input: Pick<CompanyBranding, "displayName" | "logoUrl" | "accentColor" | "backgroundColor" | "customDomain">) => request<{ data: CompanyBranding }>(`/account/organizations/${encodeURIComponent(organizationId)}/branding`, { method: "PUT", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
      },
    },
  },
  branding: {
    public: (hostname: string) => publicRequest<{ data: CompanyBranding | null }>(`/public/company-branding?hostname=${encodeURIComponent(hostname)}`),
  },
  agentTemplates: { list: () => request<{ data: CompanyAgentTemplate[] }>("/agents/templates") },
  mcp: {
    catalog: () => request<{ data: McpCatalogEntry[]; errors?: string[] }>("/mcp/catalog"),
    connections: () => request<{ data: McpConnection[] }>("/mcp/connections"),
    connect: (serverId: string, credential?: { accessToken: string; refreshToken?: string; expiresAt?: number }) => request<McpConnection>("/mcp/connections", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ serverId, ...(credential ? { ...credential } : {}) }) }),
    disconnect: (serverId: string) => request<void>(`/mcp/connections/${encodeURIComponent(serverId)}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
  apps: {
    list: () => request<Page<Toolkit>>("/apps"),
    connections: () => request<Page<ConnectedAccount>>("/apps/connections"),
    disconnect: (connectionId: string) => request<void>(`/apps/connections/${encodeURIComponent(connectionId)}`, { method: "DELETE" }),
    connect: (toolkit: string, alias?: string) => request<{ toolkit: string; alias?: string; url: string }>(`/apps/${encodeURIComponent(toolkit)}/connect`, { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(alias ? { alias } : {}) }),
  },
  meetings: {
    list: () => request<MeetingWorkspace>("/meetings"),
    profile: () => request<MeetingRepresentativeProfile>("/meetings/profile"),
    updateProfile: (profile: Partial<MeetingRepresentativeProfile>) => request<MeetingRepresentativeProfile>("/meetings/profile", { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(profile) }),
    deleteContact: (id: string) => request<void>(`/meetings/contacts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  channels: {
    list: () => request<Page<ChannelConnection>>("/channels"),
    createLinkCode: (provider: "slack" | "whatsapp" | "sendblue") => request<ChannelLinkCode>("/channels/link-code", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ provider }) }),
    update: (channel: ChannelConnection, proactiveOptIn: boolean) => request<{ id: string; provider: string; proactiveOptIn: boolean }>(`/channels/${encodeURIComponent(channel.provider)}/${encodeURIComponent(channel.id)}`, { method: "PATCH", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ proactiveOptIn }) }),
    unlink: (channel: ChannelConnection) => request<void>(`/channels/${encodeURIComponent(channel.provider)}/${encodeURIComponent(channel.id)}`, { method: "DELETE" }),
  },
  devices: {
    list: () => request<Page<AccountOverview["devices"][number]>>("/devices"),
    revoke: (id: string) => request<void>(`/devices/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  triggers: {
    list: () => request<Page<Trigger>>("/triggers"),
    catalogue: {
      toolkits: (connectedOnly = false) => request<{ data: TriggerToolkit[] }>(`/triggers/catalog/toolkits?connectedOnly=${connectedOnly}`),
      types: (toolkit: string, page = 1, pageSize = 50) => request<{ data: TriggerCatalogueItem[]; page: number; pageSize: number; total: number; totalPages: number }>(`/triggers/catalog/toolkits/${encodeURIComponent(toolkit)}?page=${page}&pageSize=${pageSize}`),
    },
    create: (slug: string, triggerConfig: Record<string, unknown> = {}, connectedAccountId?: string) => request<Trigger>("/triggers", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ slug, triggerConfig, ...(connectedAccountId ? { connectedAccountId } : {}) }) }),
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
    save: (input: { category: string; key: string; value: string; confidence?: number; sensitivity: "normal" | "sensitive"; projectId?: string; personKey?: string; reviewAt?: number; expiresAt?: number }) => request<MemoryFact>("/memory", { method: "POST", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/memory/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
  scratchpad: {
    list: (query = "") => request<{ data: ScratchpadNote[] }>(`/scratchpad${query ? `?query=${encodeURIComponent(query)}` : ""}`),
    save: (key: string, content: string) => request<ScratchpadNote>(`/scratchpad/${encodeURIComponent(key)}`, { method: "PUT", headers: { "Idempotency-Key": idempotency() }, body: JSON.stringify({ content }) }),
    remove: (key?: string) => request<void>(`/scratchpad${key ? `?key=${encodeURIComponent(key)}` : ""}`, { method: "DELETE", headers: { "Idempotency-Key": idempotency() } }),
  },
};
