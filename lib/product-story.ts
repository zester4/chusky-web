// Public product copy grounded in the product owner's capability brief.
// These are supported surfaces and examples, not customer endorsements or live status.
export type ProductConnection = { name: string; description: string; logo?: string };

export const workChannels: ProductConnection[] = [
  { name: "Slack", description: "Keep team requests close to the conversation.", logo: "/logos/slack.svg" },
  { name: "WhatsApp", description: "Send a request from the messages you already use.", logo: "/logos/whatsapp.svg" },
  { name: "Telegram", description: "Ask for work and receive updates on the go.", logo: "/logos/telegram.svg" },
  { name: "iMessage", description: "Reach Chusky through a linked private conversation.", logo: "/logos/imessage.svg" },
  { name: "SMS", description: "Keep a simple text-message way to reach Chusky." },
  { name: "X", description: "Bring supported X conversations into your workflow.", logo: "/logos/x-twitter.svg" },
  { name: "Web chat", description: "A workspace for requests, files, and progress." },
  { name: "CLI", description: "Work with Chusky from your terminal." },
];

export const meetingPlatforms: ProductConnection[] = [
  { name: "Zoom", description: "Meeting participation and follow-through", logo: "/logos/zoom.svg" },
  { name: "Google Meet", description: "Meeting participation and follow-through", logo: "/logos/google-meet.svg" },
  { name: "Microsoft Teams", description: "Meeting participation and follow-through", logo: "/logos/teams.svg" },
  { name: "Webex", description: "Meeting participation and follow-through", logo: "/logos/webex.svg" },
];

export const connectedApps: ProductConnection[] = [
  { name: "Gmail", description: "Review new messages and prepare the next reply.", logo: "/logos/gmail.svg" },
  { name: "Google Calendar", description: "Keep up with meetings and changes to the day.", logo: "/logos/google-calendar.svg" },
  { name: "Notion", description: "Bring project knowledge and notes into the work.", logo: "/logos/notion.svg" },
  { name: "Box", description: "Find the files a task needs and carry the result forward.", logo: "/logos/box.png" },
  { name: "Stripe", description: "Work with supported payment actions under your controls.", logo: "/logos/stripe.svg" },
  { name: "Salesforce", description: "Update customer records as the work moves forward.", logo: "/logos/salesforce.svg" },
  { name: "HubSpot", description: "Keep deal updates and agreed follow-ups connected.", logo: "/logos/hubspot.svg" },
  { name: "Slack", description: "Bring team messages and handoffs into the same workflow.", logo: "/logos/slack.svg" },
];
