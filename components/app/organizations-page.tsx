"use client";

import { Activity, Building2, Check, CircleDollarSign, Copy, FolderKanban, KeyRound, LoaderCircle, Pencil, Plus, RefreshCw, ScrollText, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { chuskyApi, type CompanyAgent, type CompanyAgentTemplate, type CompanyAuditEvent, type CompanyBranding, type CompanyPolicy, type CompanyRun, type CompanyUsage, type CreatedDeveloperProject, type DeveloperProject } from "@/lib/chusky-api";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";

type Workspace = { id: string; name: string; slug: string };
type Member = { id: string; userId: string; role: string; user?: { name?: string; email?: string } };
type Invitation = { id: string; email: string; role: string; status: string; expiresAt: string };
type OrganizationPanel = "overview" | "members" | "projects" | "access" | "branding" | "activity";

export function OrganizationsPage() {
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const session = authClient.useSession();
  const [selectedId, setSelectedId] = useState("");
  const [projects, setProjects] = useState<DeveloperProject[]>();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [templates, setTemplates] = useState<CompanyAgentTemplate[]>();
  const [agents, setAgents] = useState<CompanyAgent[]>();
  const [policy, setPolicy] = useState<CompanyPolicy>();
  const [companyRuns, setCompanyRuns] = useState<CompanyRun[]>();
  const [companyAudit, setCompanyAudit] = useState<CompanyAuditEvent[]>();
  const [companyUsage, setCompanyUsage] = useState<CompanyUsage>();
  const [branding, setBranding] = useState<CompanyBranding>();
  const [brandingDraft, setBrandingDraft] = useState<Pick<CompanyBranding, "displayName" | "logoUrl" | "accentColor" | "backgroundColor" | "customDomain">>();
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryRefresh, setTelemetryRefresh] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");
  const [agentGuidance, setAgentGuidance] = useState("");
  const [editingAgent, setEditingAgent] = useState<CompanyAgent>();
  const [editingInstructions, setEditingInstructions] = useState("");
  const [removingAgent, setRemovingAgent] = useState<CompanyAgent>();
  const [projectName, setProjectName] = useState("");
  const [busy, setBusy] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedDeveloperProject>();
  const [copied, setCopied] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [activePanel, setActivePanel] = useState<OrganizationPanel>("overview");

  const workspaceList = (organizations.data ?? []) as Workspace[];
  const active = activeOrganization.data as (Workspace & { members?: Member[]; invitations?: Invitation[] }) | null | undefined;
  const organizationId = selectedId || active?.id || "";
  const organization = workspaceList.find((item) => item.id === organizationId) ?? active;
  const members = active?.id === organizationId ? active.members ?? [] : [];
  const invitations = active?.id === organizationId ? active.invitations ?? [] : [];
  const currentRole = members.find((member) => member.userId === session.data?.user.id)?.role;
  const canManage = currentRole === "owner" || currentRole === "admin";
  const chosenProject = useMemo(() => projects?.find((item) => item.id === selectedProjectId), [projects, selectedProjectId]);
  const pendingInvitations = invitations.filter((item) => item.status === "pending");
  const panelTabs: Array<{ id: OrganizationPanel; label: string; description: string }> = [
    { id: "overview", label: "Overview", description: "Workspace identity and setup" },
    { id: "members", label: "Members", description: "People and invitations" },
    { id: "projects", label: "Projects & agents", description: "Runtime configuration" },
    { id: "access", label: "Access & policy", description: "MCP and guardrails" },
    { id: "branding", label: "Branding", description: "Appearance and domain" },
    { id: "activity", label: "Activity", description: "Runs, usage, and audit" },
  ];

  const loadProjects = async (id: string) => {
    if (!id) { setProjects(undefined); setAgents(undefined); return; }
    try {
      const result = await chuskyApi.account.projects.list(id);
      setProjects(result.data);
      setSelectedProjectId((current) => result.data.some((item) => item.id === current) ? current : result.data[0]?.id ?? "");
    } catch (cause) {
      setProjects(undefined);
      setError(cause instanceof Error ? cause.message : "Could not load workspace projects.");
    }
  };

  const loadTemplates = async () => {
    try { setTemplates((await chuskyApi.agentTemplates.list()).data); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load agent templates."); }
  };

  const loadAgents = async (projectId: string) => {
    if (!projectId) { setAgents(undefined); return; }
    try { setAgents((await chuskyApi.account.projects.agents.list(projectId)).data); }
    catch (cause) { setAgents(undefined); setError(cause instanceof Error ? cause.message : "Could not load project agents."); }
  };

  const loadPolicy = async (projectId: string) => {
    if (!projectId) { setPolicy(undefined); return; }
    try { setPolicy((await chuskyApi.account.projects.policy.get(projectId)).data); }
    catch (cause) { setPolicy(undefined); setError(cause instanceof Error ? cause.message : "Could not load the project policy."); }
  };

  useEffect(() => { void loadTemplates(); }, []);
  useEffect(() => { if (organizationId) void loadProjects(organizationId); }, [organizationId]);
  useEffect(() => {
    let current = true;
    if (!organizationId) { setBranding(undefined); setBrandingDraft(undefined); return () => { current = false; }; }
    void chuskyApi.account.organizations.branding.get(organizationId).then((result) => {
      if (!current) return;
      setBranding(result.data);
      setBrandingDraft({ displayName: result.data.displayName === "Chusky" ? organization?.name ?? result.data.displayName : result.data.displayName, logoUrl: result.data.logoUrl ?? "", accentColor: result.data.accentColor, backgroundColor: result.data.backgroundColor, customDomain: result.data.customDomain ?? "" });
    }).catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : "Could not load workspace branding."); });
    return () => { current = false; };
  }, [organizationId, organization?.name]);
  useEffect(() => { void loadAgents(selectedProjectId); }, [selectedProjectId]);
  useEffect(() => { void loadPolicy(selectedProjectId); }, [selectedProjectId]);
  useEffect(() => {
    let current = true;
    if (!selectedProjectId || !canManage) {
      setCompanyRuns(undefined); setCompanyAudit(undefined); setCompanyUsage(undefined);
      setTelemetryLoading(false);
      return () => { current = false; };
    }
    setTelemetryLoading(true);
    void Promise.all([
      chuskyApi.account.projects.telemetry.runs(selectedProjectId),
      chuskyApi.account.projects.telemetry.audit(selectedProjectId),
      chuskyApi.account.projects.telemetry.usage(selectedProjectId),
    ]).then(([runs, audit, usage]) => {
      if (!current) return;
      setCompanyRuns(runs.data); setCompanyAudit(audit.data); setCompanyUsage(usage);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Could not load company activity.");
    }).finally(() => { if (current) setTelemetryLoading(false); });
    return () => { current = false; };
  }, [selectedProjectId, canManage, telemetryRefresh]);

  const refresh = async () => {
    setError("");
    setTelemetryRefresh((value) => value + 1);
    await organizations.refetch();
    if (organizationId) {
      await activeOrganization.refetch();
      await loadProjects(organizationId);
    }
  };

  const createWorkspace = async () => {
    setBusy("workspace"); setError(""); setNotice("");
    const cleanName = workspaceName.trim();
    const slug = cleanName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
    if (!cleanName || !slug) { setError("Enter a workspace name with at least one letter or number."); setBusy(""); return; }
    try {
      const result = await authClient.organization.create({ name: cleanName.slice(0, 100), slug });
      if (result.error) throw new Error(result.error.message || "Could not create the workspace.");
      const created = result.data as Workspace | null;
      if (!created?.id) throw new Error("The workspace was created, but its ID was not returned. Refresh and try again.");
      setWorkspaceName(""); setSelectedId(created.id); setNotice("Workspace created. Invite your team, then create a project for your company agent.");
      await organizations.refetch();
      await authClient.organization.setActive({ organizationId: created.id });
      await activeOrganization.refetch();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the workspace."); }
    finally { setBusy(""); }
  };

  const chooseWorkspace = async (id: string) => {
    setSelectedId(id); setSelectedProjectId(""); setProjects(undefined); setAgents(undefined); setError(""); setNotice("");
    if (!id) return;
    setBusy("switch");
    try {
      const result = await authClient.organization.setActive({ organizationId: id });
      if (result.error) throw new Error(result.error.message || "Could not switch workspace.");
      await activeOrganization.refetch();
      await loadProjects(id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not switch workspace."); }
    finally { setBusy(""); }
  };

  const inviteMember = async () => {
    if (!organizationId) return;
    setBusy("invite"); setError(""); setNotice("");
    try {
      const result = await authClient.organization.inviteMember({ email: inviteEmail.trim(), role: "member", organizationId });
      if (result.error) throw new Error(result.error.message || "Could not send the invitation.");
      setInviteEmail(""); setNotice("Invitation sent. The person must accept it using the invited email address.");
      await activeOrganization.refetch();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send the invitation."); }
    finally { setBusy(""); }
  };

  const createProject = async () => {
    if (!organizationId) return;
    setBusy("project"); setError(""); setNotice("");
    try {
      const project = await chuskyApi.account.projects.create({ name: projectName.trim(), organizationId });
      setProjects((current) => [...(current ?? []), project]);
      setSelectedProjectId(project.id); setProjectName(""); setCreatedKey(project);
      setNotice("Company project created. Its secret is shown once; copy it into your server's secret manager.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the API project."); }
    finally { setBusy(""); }
  };

  const createAgent = async () => {
    if (!selectedProjectId || !templateSlug) return;
    setBusy("agent"); setError(""); setNotice("");
    try {
      const created = await chuskyApi.account.projects.agents.create(selectedProjectId, { template: templateSlug, ...(agentGuidance.trim() ? { instructions: agentGuidance.trim() } : {}) });
      setAgents((current) => [...(current ?? []), created]);
      setTemplateSlug(""); setAgentGuidance("");
      setNotice(`${created.name} is ready. External Composio actions require approval before execution.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the agent profile."); }
    finally { setBusy(""); }
  };

  const startAgentEdit = (agent: CompanyAgent) => { setEditingAgent(agent); setEditingInstructions(agent.instructions); setError(""); setNotice(""); };
  const saveAgent = async () => {
    if (!selectedProjectId || !editingAgent) return;
    setBusy(`agent:${editingAgent.id}`); setError(""); setNotice("");
    try {
      const updated = await chuskyApi.account.projects.agents.update(selectedProjectId, editingAgent.id, { instructions: editingInstructions.trim() });
      setAgents((current) => current?.map((item) => item.id === updated.id ? updated : item));
      setEditingAgent(undefined); setNotice(`${updated.name} instructions saved.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the agent profile."); }
    finally { setBusy(""); }
  };
  const removeAgent = async (agent: CompanyAgent) => {
    if (!selectedProjectId) return;
    setBusy(`agent:${agent.id}`); setError(""); setNotice("");
    try {
      await chuskyApi.account.projects.agents.remove(selectedProjectId, agent.id);
      setAgents((current) => current?.filter((item) => item.id !== agent.id));
      setNotice(`${agent.name} removed from this project.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove the agent profile."); }
    finally { setBusy(""); }
  };

  const savePolicy = async () => {
    if (!selectedProjectId || !policy) return;
    setSavingPolicy(true); setError(""); setNotice("");
    try {
      const result = await chuskyApi.account.projects.policy.update(selectedProjectId, policy);
      setPolicy(result.data); setNotice("Company tool and run limits saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the company policy."); }
    finally { setSavingPolicy(false); }
  };

  const saveBranding = async () => {
    if (!organizationId || !brandingDraft || !canManage) return;
    setBusy("branding"); setError(""); setNotice("");
    try {
      const result = await chuskyApi.account.organizations.branding.update(organizationId, brandingDraft);
      setBranding(result.data);
      setBrandingDraft({ displayName: result.data.displayName, logoUrl: result.data.logoUrl ?? "", accentColor: result.data.accentColor, backgroundColor: result.data.backgroundColor, customDomain: result.data.customDomain ?? "" });
      setNotice(result.data.customDomain ? "Branding saved. Point the custom domain at your dashboard host to complete DNS setup." : "Workspace branding saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save workspace branding."); }
    finally { setBusy(""); }
  };

  const policyToolChoices = [
    { name: "Composio search and tool discovery", slugs: ["COMPOSIO_SEARCH_TOOL", "COMPOSIO_SEARCH_TOOLS", "COMPOSIO_GET_TOOL_SCHEMAS"] },
    { name: "Public web search and page retrieval", slugs: ["COMPOSIO_SEARCH_WEB", "COMPOSIO_SEARCH_FETCH_URL_CONTENT"] },
    { name: "Execute connected-app actions (approval required)", slugs: ["COMPOSIO_EXECUTE_TOOL", "COMPOSIO_MULTI_EXECUTE_TOOL"] },
    { name: "Chusky skill search and reading", slugs: ["CHUCK_SEARCH_SKILLS", "CHUCK_READ_SKILL_FILE"] },
  ];
  const durationOptions = ["5m", "30m", "1h", "3h", "6h", "3d", "1w"] as const;

  const copyKey = async () => {
    if (!createdKey) return;
    try { await navigator.clipboard.writeText(createdKey.key); setCopied(true); }
    catch { setError("Clipboard access failed. Select and copy the key manually."); }
  };

  const mcpEndpoint = process.env.NEXT_PUBLIC_CHUSKY_MCP_URL || "https://chusky-mcp.adesrnd.workers.dev/mcp";
  const mcpConfig = JSON.stringify({ mcpServers: { chusky: { url: mcpEndpoint, headers: { Authorization: "Bearer ${CHUSKY_API_KEY}", "X-Chusky-User-Id": "${CHUSKY_END_USER_ID}" } } } }, null, 2);
  const copyMcpConfig = async () => {
    try { await navigator.clipboard.writeText(mcpConfig); setCopiedMcp(true); }
    catch { setError("Clipboard access failed. Select and copy the MCP configuration manually."); }
  };

  return <>
    <PageHeading eyebrow="Company platform" title="Organizations" description="Create a shared workspace, invite teammates, and configure company-scoped agent projects. Connected apps and OAuth accounts remain managed by Composio." action={<Button secondary onClick={() => void refresh()} disabled={busy !== ""}><span className="hidden sm:inline-flex"><RefreshCw size={13} /></span> Refresh</Button>} />
    {error && <div role="alert" className="mb-4 border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">{error}</div>}
    {notice && <div role="status" className="mb-4 border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900">{notice}</div>}
    <div className="mb-4 overflow-x-auto border-b border-foreground/10" role="tablist" aria-label="Organization settings">
      <div className="flex min-w-max gap-1">
        {panelTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activePanel === tab.id} disabled={!organizationId && tab.id !== "overview"} onClick={() => setActivePanel(tab.id)} className={`group min-h-12 border-b-2 px-3 text-left transition-colors first:pl-1 disabled:cursor-not-allowed disabled:opacity-40 ${activePanel === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground"}`}>
          <span className="block text-[11px] font-medium">{tab.label}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">{tab.description}</span>
        </button>)}
      </div>
    </div>
    {!organizationId && activePanel === "overview" && <Card className="mb-4 border-dashed p-5 sm:p-7"><div className="flex max-w-2xl items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background"><Building2 size={17} /></span><div><h2 className="text-sm font-medium">Start with a company workspace</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Create a workspace to give your team a shared boundary for projects, agent policies, MCP access, and audit activity. Personal Chusky data remains separate.</p></div></div></Card>}
    <div className="grid gap-4">
      <section className="space-y-4">
        {activePanel === "overview" && <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center border border-foreground/10"><Building2 size={17} /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-medium">Workspace</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Membership and invitations are handled by Chusky accounts. Each workspace has isolated projects and policies.</p>
            {workspaceList.length > 0 && <label className="mt-3 block text-[10px] text-muted-foreground">Select organization<select value={organizationId} onChange={(event) => void chooseWorkspace(event.target.value)} disabled={busy === "switch"} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs text-foreground"><option value="">Choose a workspace</option>{workspaceList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            {!workspaceList.length && organizations.isPending && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={13} className="animate-spin" /> Loading workspaces…</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} maxLength={100} aria-label="New workspace name" placeholder="e.g. Acme Sales" className="min-h-9 min-w-0 flex-1 border border-foreground/15 bg-transparent px-2.5 text-xs outline-none focus:border-foreground/50" /><Button disabled={!workspaceName.trim() || busy === "workspace"} onClick={() => void createWorkspace()}>{busy === "workspace" ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />} Create workspace</Button></div>
            {organization && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-3"><span className="text-xs font-medium">{organization.name}</span><Status tone={currentRole ? "green" : "gray"}>{currentRole ?? "Loading role"}</Status><span className="font-mono text-[10px] text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}</span></div>}
            {organization && <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Workspace summary"><div className="border border-foreground/10 p-2.5"><Users size={13} className="text-muted-foreground" /><p className="mt-2 text-base tabular-nums">{members.length}</p><p className="text-[9px] text-muted-foreground">Members</p></div><div className="border border-foreground/10 p-2.5"><FolderKanban size={13} className="text-muted-foreground" /><p className="mt-2 text-base tabular-nums">{projects?.length ?? "—"}</p><p className="text-[9px] text-muted-foreground">Projects</p></div><div className="border border-foreground/10 p-2.5"><KeyRound size={13} className="text-muted-foreground" /><p className="mt-2 text-base tabular-nums">{pendingInvitations.length}</p><p className="text-[9px] text-muted-foreground">Pending invites</p></div></div>}
          </div></div>
        </Card>}

        {organizationId && activePanel === "members" && <Card>
          <div className="border-b border-foreground/10 p-4 sm:p-5"><h2 className="text-sm font-medium">Team members</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Invite teammates as members. Only workspace owners and admins can create project keys or change agent rules.</p>
            {canManage && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} aria-label="Teammate email" placeholder="teammate@company.com" className="min-h-9 min-w-0 flex-1 border border-foreground/15 bg-transparent px-2.5 text-xs outline-none focus:border-foreground/50" /><Button disabled={!inviteEmail.includes("@") || busy === "invite"} onClick={() => void inviteMember()}>{busy === "invite" ? <LoaderCircle size={13} className="animate-spin" /> : <UserPlus size={13} />} Invite member</Button></div>}
          </div>
          {members.length ? members.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3 last:border-0 sm:px-5"><div className="min-w-0"><p className="truncate text-xs">{member.user?.name || member.user?.email || "Workspace member"}</p><p className="truncate text-[10px] text-muted-foreground">{member.user?.email || member.userId}</p></div><Status tone={member.role === "owner" || member.role === "admin" ? "green" : "gray"}>{member.role}</Status></div>) : <p className="p-4 text-xs text-muted-foreground">Loading members or no members are available yet.</p>}
          {invitations.filter((item) => item.status === "pending").map((invitation) => <div key={invitation.id} className="flex items-center justify-between gap-3 border-t border-dashed border-foreground/15 px-4 py-3 sm:px-5"><div><p className="text-xs">{invitation.email}</p><p className="text-[10px] text-muted-foreground">Invitation expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div><Status tone="amber">Invited</Status></div>)}
        </Card>}

        {organizationId && activePanel === "branding" && brandingDraft && <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-medium">Branding and custom domain</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Customize the dashboard shell for this workspace. DNS and TLS stay with your domain provider; Chusky only stores the verified hostname mapping.</p></div><Status tone={branding?.customDomainStatus === "pending_dns" ? "amber" : "gray"}>{branding?.customDomainStatus === "pending_dns" ? "DNS pending" : "Default host"}</Status></div>
          <fieldset disabled={!canManage || busy === "branding"} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] text-muted-foreground sm:col-span-2">Display name<input value={brandingDraft.displayName} onChange={(event) => setBrandingDraft({ ...brandingDraft, displayName: event.target.value })} maxLength={120} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 text-xs text-foreground outline-none focus:border-foreground/50" /></label>
            <label className="text-[10px] text-muted-foreground sm:col-span-2">Logo URL (HTTPS)<input value={brandingDraft.logoUrl ?? ""} onChange={(event) => setBrandingDraft({ ...brandingDraft, logoUrl: event.target.value })} placeholder="https://assets.example.com/logo.svg" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 text-xs text-foreground outline-none focus:border-foreground/50" /></label>
            <label className="text-[10px] text-muted-foreground">Accent color<input value={brandingDraft.accentColor} onChange={(event) => setBrandingDraft({ ...brandingDraft, accentColor: event.target.value })} placeholder="#111111" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 font-mono text-xs text-foreground outline-none focus:border-foreground/50" /></label>
            <label className="text-[10px] text-muted-foreground">Background color<input value={brandingDraft.backgroundColor} onChange={(event) => setBrandingDraft({ ...brandingDraft, backgroundColor: event.target.value })} placeholder="#f7f7f4" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 font-mono text-xs text-foreground outline-none focus:border-foreground/50" /></label>
            <label className="text-[10px] text-muted-foreground sm:col-span-2">Custom dashboard domain<input value={brandingDraft.customDomain ?? ""} onChange={(event) => setBrandingDraft({ ...brandingDraft, customDomain: event.target.value })} placeholder="app.example.com" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 font-mono text-xs text-foreground outline-none focus:border-foreground/50" /></label>
          </fieldset>
          <div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] leading-4 text-muted-foreground">Use a DNS CNAME to your deployed dashboard, then save the hostname here.</p><Button disabled={!canManage || busy === "branding" || !brandingDraft.displayName.trim()} onClick={() => void saveBranding()}>{busy === "branding" ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Save branding</Button></div>
        </Card>}
      </section>

      <section className="space-y-4">
        {organizationId && activePanel === "projects" && <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-medium">Company API project</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Project keys are hashed at rest and shown once. Defaults support agent runs, Composio connections/triggers, read-only approval status, tasks, webhooks, audit, and usage. Human approval decisions stay outside the project key.</p>
          {canManage && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={100} aria-label="API project name" placeholder="e.g. Salesforce production" className="min-h-9 min-w-0 flex-1 border border-foreground/15 bg-transparent px-2.5 text-xs outline-none focus:border-foreground/50" /><Button disabled={!projectName.trim() || busy === "project"} onClick={() => void createProject()}>{busy === "project" ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />} Create project</Button></div>}
          {projects === undefined ? <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={13} className="animate-spin" /> Loading projects…</p> : projects.length ? <div className="mt-3 space-y-2">{projects.map((project) => <button type="button" key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`block w-full border p-3 text-left transition-colors ${selectedProjectId === project.id ? "border-foreground/50 bg-foreground/[0.03]" : "border-foreground/10 hover:border-foreground/30"}`}><span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-medium">{project.name}</span><Status>{project.scopes.length} scopes</Status></span><span className="mt-1 block break-all font-mono text-[10px] text-muted-foreground">{project.keyPrefix}…</span></button>)}</div> : <p className="mt-4 border border-dashed border-foreground/20 p-3 text-xs text-muted-foreground">No company projects yet. Create one to attach agent profiles and issue a scoped server key.</p>}
        </Card>}

        {chosenProject && activePanel === "projects" && <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-2.5"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><div><h2 className="text-sm font-medium">Agent templates</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">External Composio executions are approval-gated by policy. A caller can further restrict tools and budgets, but cannot widen the project grant.</p></div></div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={templateSlug} onChange={(event) => setTemplateSlug(event.target.value)} aria-label="Agent template" className="min-h-9 min-w-0 flex-1 border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Choose a specialist template</option>{(templates ?? []).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select><Button disabled={!templateSlug || busy === "agent" || !canManage} onClick={() => void createAgent()}>{busy === "agent" ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />} Add agent</Button></div>
          {templateSlug && <label className="mt-3 block text-[10px] text-muted-foreground">Company-specific instructions (optional)<textarea value={agentGuidance} onChange={(event) => setAgentGuidance(event.target.value)} maxLength={5000} rows={3} placeholder="For lead research: only target companies with 50+ employees; cite the source for headcount and prepare follow-up drafts for review." className="mt-1.5 min-h-20 w-full resize-y border border-foreground/15 bg-transparent p-2.5 text-xs leading-5 text-foreground outline-none focus:border-foreground/50" /></label>}
           {agents === undefined ? <p className="mt-4 text-xs text-muted-foreground">Loading agent profiles…</p> : agents.length ? <div className="mt-3 border-t border-foreground/10">{agents.map((agent) => <div key={agent.id} className="border-b border-foreground/10 py-3 last:border-0"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-medium">{agent.name}</p><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{templates?.find((item) => item.slug === agent.template)?.outcome ?? agent.template}</p></div><div className="flex shrink-0 flex-wrap gap-2"><Status tone="amber">Approval before external action</Status>{canManage && <><Button secondary disabled={busy === `agent:${agent.id}`} onClick={() => startAgentEdit(agent)}><Pencil size={11} /> Edit</Button><Button secondary disabled={busy === `agent:${agent.id}`} onClick={() => setRemovingAgent(agent)}><Trash2 size={11} /> Remove</Button></>}</div></div><p className="mt-1 font-mono text-[9px] text-muted-foreground">ID: {agent.id} · max {agent.budget.maxToolCalls ?? "project limit"} tool calls · ${agent.budget.maxCost ?? "project limit"} run cost</p>{editingAgent?.id === agent.id && <div className="mt-3 border-t border-foreground/10 pt-3"><label className="block text-[10px] text-muted-foreground">Instructions<textarea value={editingInstructions} onChange={(event) => setEditingInstructions(event.target.value)} maxLength={5000} rows={4} className="mt-1.5 min-h-20 w-full resize-y border border-foreground/15 bg-transparent p-2.5 text-xs leading-5 text-foreground outline-none focus:border-foreground/50" /></label><div className="mt-2 flex flex-wrap gap-2"><Button disabled={busy === `agent:${agent.id}`} onClick={() => void saveAgent()}>{busy === `agent:${agent.id}` ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Save instructions</Button><Button secondary disabled={busy === `agent:${agent.id}`} onClick={() => setEditingAgent(undefined)}>Cancel</Button></div></div>}</div>)}</div> : <p className="mt-4 border border-dashed border-foreground/20 p-3 text-xs text-muted-foreground">No agents configured for this project. Choose a template to create one.</p>}
        </Card>}

        {chosenProject && activePanel === "access" && <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-2.5"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><div><h2 className="text-sm font-medium">Connect through MCP</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Use Chusky from Claude, Cursor, ChatGPT, or another MCP host. The host sends your project key and a stable customer identity to the remote Worker.</p></div></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><label className="text-[10px] text-muted-foreground">Remote MCP endpoint<code className="mt-1.5 block break-all border border-foreground/15 bg-foreground/[0.03] px-2.5 py-2 font-mono text-[11px] text-foreground">{mcpEndpoint}</code></label><Button secondary onClick={() => void copyMcpConfig()}>{copiedMcp ? <Check size={13} /> : <Copy size={13} />}{copiedMcp ? "Copied config" : "Copy config"}</Button></div>
          <pre className="mt-3 max-h-44 overflow-auto border border-foreground/10 bg-foreground/[0.03] p-3 text-[10px] leading-5 text-muted-foreground"><code>{mcpConfig}</code></pre>
          <div className="mt-3 grid gap-2 border-t border-foreground/10 pt-3 text-[10px] leading-5 text-muted-foreground sm:grid-cols-2"><p><strong className="text-foreground">Scope:</strong> {chosenProject.scopes.length} project scopes · key prefix {chosenProject.keyPrefix}…</p><p><strong className="text-foreground">Identity:</strong> set a stable non-PII <code>X-Chusky-User-Id</code> per customer. Never put the project key in browser code.</p></div>
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">MCP can start and monitor policy-governed work, but it cannot approve its own external actions. Human approvals remain in Chusky or your authorized host.</p>
        </Card>}

        {chosenProject && activePanel === "access" && <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-medium">Project policy</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">These server-enforced ceilings apply to every run. Agents and callers can narrow them, never expand them.</p></div><Status tone="amber">Human approval stays on</Status></div>
          {policy === undefined ? <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={13} className="animate-spin" /> Loading policy…</p> : <>
            <fieldset className="mt-4 space-y-2" disabled={!canManage || savingPolicy}>
              <legend className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Allowed capabilities</legend>
              {policyToolChoices.map((choice) => {
                const allow = policy.tools?.allow ?? [];
                const checked = choice.slugs.every((slug) => allow.includes(slug));
                return <label key={choice.name} className="flex min-h-9 items-center gap-2.5 border border-foreground/10 px-2.5 py-2 text-xs"><input type="checkbox" checked={checked} onChange={(event) => {
                  const next = new Set(allow);
                  for (const slug of choice.slugs) {
                    if (event.target.checked) next.add(slug);
                    else next.delete(slug);
                  }
                  setPolicy({ ...policy, tools: { ...policy.tools, allow: [...next] } });
                }} className="h-4 w-4 accent-foreground" />{choice.name}</label>;
              })}
            </fieldset>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-[10px] text-muted-foreground">Maximum run time<select disabled={!canManage || savingPolicy} value={policy.budget?.duration ?? "30m"} onChange={(event) => setPolicy({ ...policy, budget: { ...policy.budget, duration: event.target.value as typeof durationOptions[number] } })} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2 text-xs text-foreground">{durationOptions.map((duration) => <option value={duration} key={duration}>{duration}</option>)}</select></label>
              <label className="text-[10px] text-muted-foreground">Maximum tool calls<input disabled={!canManage || savingPolicy} type="number" min={1} max={100} value={policy.budget?.maxToolCalls ?? 40} onChange={(event) => setPolicy({ ...policy, budget: { ...policy.budget, maxToolCalls: Number(event.target.value) } })} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2 text-xs text-foreground" /></label>
              <label className="text-[10px] text-muted-foreground">Maximum model cost per run (USD)<input disabled={!canManage || savingPolicy} type="number" min={0} max={1000} step="0.25" value={policy.budget?.maxCost ?? 5} onChange={(event) => setPolicy({ ...policy, budget: { ...policy.budget, maxCost: Number(event.target.value) } })} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-transparent px-2 text-xs text-foreground" /></label>
            </div>
            {canManage ? <div className="mt-4 flex justify-end"><Button disabled={savingPolicy || policy.budget?.maxToolCalls === 0 || (policy.tools?.allow?.length ?? 0) === 0} onClick={() => void savePolicy()}>{savingPolicy ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Save policy</Button></div> : <p className="mt-3 text-[10px] text-muted-foreground">Only workspace owners and admins can change this policy.</p>}
            <p className="mt-3 border-t border-foreground/10 pt-3 text-[10px] leading-5 text-muted-foreground">Connected-app execution always pauses for human approval. Criteria such as company size and follow-up timing belong in the agent instructions or the existing trigger/scheduling workflow.</p>
          </>}
        </Card>}

        {chosenProject && canManage && activePanel === "activity" && <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-3"><Activity size={16} className="mt-0.5 shrink-0" /><div><h2 className="text-sm font-medium">Company activity</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Run status and model spend are shared across callers of this project key. Prompts, outputs, and connected-account details stay with each caller.</p></div></div>
          {telemetryLoading && <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={13} className="animate-spin" /> Loading company activity…</p>}
          {!telemetryLoading && companyUsage && <>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="border border-foreground/10 p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><CircleDollarSign size={13} /> Model spend · {companyUsage.currentMonth.month}</p><p className="mt-1 text-lg tabular-nums">${companyUsage.currentMonth.costUsd.toFixed(2)}</p></div>
              <div className="border border-foreground/10 p-3"><p className="text-[10px] text-muted-foreground">Completed this month</p><p className="mt-1 text-lg tabular-nums">{companyUsage.currentMonth.completedRuns}</p></div>
              <div className="border border-foreground/10 p-3"><p className="text-[10px] text-muted-foreground">Active · recent indexed</p><p className="mt-1 text-lg tabular-nums">{companyUsage.runs.active} <span className="text-xs text-muted-foreground">· {companyUsage.runs.indexed}</span></p></div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <section aria-labelledby="company-runs-title"><h3 id="company-runs-title" className="flex items-center gap-2 border-b border-foreground/10 pb-2 text-xs font-medium"><Activity size={13} /> Recent runs</h3>
                {companyRuns?.length ? <div className="divide-y divide-foreground/10">{companyRuns.map((run) => <div key={run.id} className="flex min-w-0 items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs">{run.agentName || run.agentId || "Agent run"}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><span className="font-mono">{run.id.slice(-12)}</span><span>·</span><span>{new Date(run.updatedAt).toLocaleString()}</span></p></div><div className="shrink-0 text-right"><Status tone={run.status === "completed" ? "green" : run.status === "failed" ? "amber" : "gray"}>{run.status.replaceAll("_", " ")}</Status>{typeof run.cost === "number" && <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">${run.cost.toFixed(2)}</p>}</div></div>)}</div> : <p className="py-4 text-xs text-muted-foreground">No agent runs have been recorded for this project yet.</p>}
              </section>
              <section aria-labelledby="company-audit-title"><h3 id="company-audit-title" className="flex items-center gap-2 border-b border-foreground/10 pb-2 text-xs font-medium"><ScrollText size={13} /> Recent API changes</h3>
                {companyAudit?.length ? <div className="divide-y divide-foreground/10">{companyAudit.slice(0, 8).map((item) => <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate font-mono text-[10px]">{item.action}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(item.at).toLocaleString()}</p></div><Status tone={item.status < 400 ? "green" : "amber"}>{item.status}</Status></div>)}</div> : <p className="py-4 text-xs text-muted-foreground">No project-key or workspace changes have been recorded yet.</p>}
              </section>
            </div>
          </>}
        </Card>}
      </section>
    </div>
    <Card className="mt-4 flex gap-2.5 p-3.5 text-xs text-muted-foreground sm:mt-5 sm:p-4"><ShieldCheck size={16} className="shrink-0 text-emerald-700" /><p><strong className="text-foreground">OAuth stays with Composio.</strong> Chusky does not store or refresh provider OAuth credentials. Each project run uses the Composio connected accounts associated with its authenticated Chusky identity.</p></Card>
    {createdKey && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3" role="dialog" aria-modal="true" aria-labelledby="company-key-title"><Card className="w-full max-w-xl p-4 shadow-2xl sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Shown once</p><h2 id="company-key-title" className="mt-1 text-lg font-medium">{createdKey.name} project key</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Store this credential in your backend secret manager. Never place it in browser code or send it to end users.</p><div className="mt-3 flex items-start gap-2 border border-foreground/15 bg-foreground/[0.03] p-2.5"><code className="min-w-0 flex-1 break-all text-[11px]">{createdKey.key}</code><Button secondary onClick={() => void copyKey()}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</Button></div><div className="mt-4 flex justify-end"><Button onClick={() => { setCreatedKey(undefined); setCopied(false); }}>I saved it</Button></div></Card></div>}
    {removingAgent && <ConfirmDialog open onOpenChange={(open) => !open && setRemovingAgent(undefined)} title={`Remove ${removingAgent.name}?`} description="This removes the agent profile from the selected project. Existing runs and audit records remain available." confirmLabel="Remove agent" destructive onConfirm={() => { const agent = removingAgent; setRemovingAgent(undefined); return removeAgent(agent); }} />}
  </>;
}
