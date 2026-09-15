"use client";

import { BackendConversationsPage, BackendDashboardPage, BackendTasksPage } from "./backend-pages";
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

export function AppPage({ section }: { section: string }) {
  if (section === "organizations") return <OrganizationsPage />;
  if (section === "developer-api") return <DeveloperApiPage />;
  if (section === "calls") return <CallsPage />;
  if (section === "meetings") return <MeetingsPage />;
  if (section === "channels") return <ChannelsPage />;
  if (section === "capabilities") return <CapabilitiesPage />;
  if (section === "workers") return <WorkersPage />;
  if (section === "skills") return <SkillsPage />;
  if (section === "reminders") return <RemindersPage />;
  if (section === "jobs") return <JobsPage />;
  if (section === "memory") return <MemoryPage />;
  if (section === "scratchpad") return <ScratchpadPage />;
  if (section === "chat") return <ChatPage />;
  if (section === "conversations") return <BackendConversationsPage />;
  if (["approvals", "apps", "reminders", "jobs", "memory", "scratchpad", "triggers", "workspace", "devices", "settings"].includes(section)) {
    return <AccountDataPage kind={section as "approvals" | "apps" | "reminders" | "jobs" | "memory" | "scratchpad" | "triggers" | "workspace" | "devices" | "settings"} />;
  }
  if (section === "tasks") return <BackendTasksPage />;
  if (section === "operations") return <OperationsDashboard />;
  if (section === "delivery") return <OperationsDashboard deliveryOnly />;
  return <BackendDashboardPage />;
}
