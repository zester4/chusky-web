import Image from "next/image";
import { ContentSection } from "./content-page";
import styles from "./product-page.module.css";

const integrationGroups = [
  { name: "Communication", description: "Start the work and receive the outcome in the channels people already use.", items: [
    ["Slack", "/logos/slack.svg"], ["WhatsApp", "/logos/whatsapp.svg"], ["Telegram", "/logos/telegram.svg"], ["iMessage", "/logos/imessage.svg"], ["SMS", "/logos/twilio.svg"], ["X", "/logos/x-twitter.svg"],
  ] },
  { name: "Calls and meetings", description: "Handle business calls and carry meeting decisions into the follow-up.", items: [
    ["Twilio", "/logos/twilio.svg"], ["Zoom", "/logos/zoom.svg"], ["Google Meet", "/logos/google-meet.svg"], ["Microsoft Teams", "/logos/teams.svg"], ["Webex", "/logos/webex.svg"],
  ] },
  { name: "CRM and sales", description: "Keep customer records, deal stages, and next actions connected.", items: [
    ["HubSpot", "/logos/hubspot.svg"], ["Salesforce", "/logos/salesforce.svg"],
  ] },
  { name: "Productivity", description: "Bring messages, schedules, notes, and files into the same piece of work.", items: [
    ["Gmail", "/logos/gmail.svg"], ["Google Calendar", "/logos/google-calendar.svg"], ["Notion", "/logos/notion.svg"], ["Box", "/logos/box.png"],
  ] },
  { name: "Payments", description: "Prepare and complete supported payment work under your approval rules.", items: [
    ["Stripe", "/logos/stripe.svg"],
  ] },
  { name: "Agents and AI", description: "Let compatible systems give work to Chusky and receive the result.", items: [
    ["MCP — both ways", "/logos/mcp.svg"], ["A2A", null],
  ] },
] as const;

export function IntegrationsSection() {
  return (
    <ContentSection id="integrations" eyebrow="6,000+ tools through one connection" title="The next step belongs in your tools." description="Connect Chusky to the tools you already run on, with thousands of apps through one connection. Chusky can work within 1,000+ tools on your behalf, using the accounts and permissions you choose.">
      <div className={styles.integrationGroups}>{integrationGroups.map((group) => <section className={styles.integrationGroup} key={group.name} aria-labelledby={`integration-${group.name.toLowerCase().replaceAll(" ", "-")}`}><div className={styles.integrationGroupHeader}><p className={styles.eyebrow}>Integration group</p><h3 id={`integration-${group.name.toLowerCase().replaceAll(" ", "-")}`}>{group.name}</h3><p>{group.description}</p></div><div className={styles.integrationEntries}>{group.items.map(([name, logo]) => <article key={name} className={styles.appEntry}>{logo ? <Image src={logo} alt="" width={32} height={32} /> : <span className={styles.integrationBadge} aria-hidden="true">A2A</span>}<div><h4>{name}</h4></div></article>)}</div></section>)}</div>
      <p className={styles.integrationFooter}>Plus thousands more apps through one connection.</p>
    </ContentSection>
  );
}
