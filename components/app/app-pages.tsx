"use client";

import { useState } from "react";
import { BackendConversationsPage, BackendTasksPage } from "./backend-pages";
import { AccountDataPage } from "./account-pages";
import { CallsPage } from "./calls-page";
import { CapabilitiesPage } from "./capabilities-page";
import { ChatPage } from "./chat-page";
import { DeveloperApiPage } from "./developer-api-page";
import { JobsPage, MemoryPage, RemindersPage, ScratchpadPage } from "./automation-pages";
import { OperationsDashboard } from "./operations-dashboard";
import { SkillsPage } from "./skills-page";
import { WorkersPage } from "./workers-page";
import { OrganizationsPage } from "./organizations-page";
import { MeetingsPage } from "./meetings-page";
import { ChannelsPage } from "./channels-page";
import { McpPage } from "./mcp-page";
import { ComposerPage } from "./composer-page";
import { MissionsPage } from "./missions-page";
import { AutonomyPage } from "./autonomy-page";
import { OverviewPage } from "./overview-page";

type WorkTab = "tasks" | "reminders" | "jobs" | "workers";

function WorkTabs({ active, onChange }: { active: WorkTab; onChange: (tab: WorkTab) => void }) {
  const tabs: Array<[WorkTab, string]> = [["tasks", "Tasks"], ["reminders", "Reminders"], ["jobs", "Recurring jobs"], ["workers", "Workers"]];
  return <nav aria-label="Work views" className="mb-5 flex min-w-0 overflow-x-auto border-b border-foreground/10 pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-1" role="tablist">{tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={active === id} aria-controls={`work-${id}-panel`} onClick={() => onChange(id)} className={`min-h-11 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:min-h-10 sm:px-4 ${active === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}>{label}</button>)}</div></nav>;
}

function WorkPage({ initialTab }: { initialTab: WorkTab }) {
  const [active, setActive] = useState(initialTab);
  return <div className="min-w-0"><WorkTabs active={active} onChange={setActive} /><section id={`work-${active}-panel`} role="tabpanel" aria-label={`${active === "tasks" ? "Tasks" : active === "reminders" ? "Reminders" : active === "jobs" ? "Recurring jobs" : "Workers"} panel`}>{active === "tasks" ? <BackendTasksPage /> : active === "reminders" ? <RemindersPage /> : active === "jobs" ? <JobsPage /> : <WorkersPage />}</section></div>;
}

export function AppPage({ section }: { section: string }) {
  if (section === "organizations") return <OrganizationsPage />;
  if (section === "developer-api") return <DeveloperApiPage />;
  if (section === "calls") return <CallsPage />;
  if (section === "meetings") return <MeetingsPage />;
  if (section === "channels") return <ChannelsPage />;
  if (section === "mcp") return <McpPage />;
  if (section === "composer") return <ComposerPage />;
  if (section === "capabilities") return <CapabilitiesPage />;
  if (section === "workers") return <WorkPage initialTab="workers" />;
  if (section === "skills") return <SkillsPage />;
  if (section === "reminders") return <WorkPage initialTab="reminders" />;
  if (section === "jobs") return <WorkPage initialTab="jobs" />;
  if (section === "memory") return <MemoryPage />;
  if (section === "scratchpad") return <ScratchpadPage />;
  if (section === "chat") return <ChatPage />;
  if (section === "conversations") return <BackendConversationsPage />;
  if (["approvals", "apps", "reminders", "jobs", "memory", "scratchpad", "triggers", "workspace", "devices", "settings"].includes(section)) {
    return <AccountDataPage kind={section as "approvals" | "apps" | "reminders" | "jobs" | "memory" | "scratchpad" | "triggers" | "workspace" | "devices" | "settings"} />;
  }
  if (section === "tasks") return <WorkPage initialTab="tasks" />;
  if (section === "missions") return <MissionsPage />;
  if (section === "autonomy") return <AutonomyPage />;
  if (section === "operations") return <OperationsDashboard />;
  if (section === "delivery") return <OperationsDashboard deliveryOnly />;
  return <OverviewPage />;
}
