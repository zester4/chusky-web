"use client";

import { ToolkitLogo } from "@/components/app/toolkit-logo";

export type TriggerProviderBrand = {
  name: string;
  logo?: string;
};

type LogoDefinition = TriggerProviderBrand & {
  aliases: string[];
};

// Trigger slugs are provider-generated identifiers, so keep the matching
// aliases here instead of coupling the UI to one provider's naming scheme.
// The assets are intentionally local so cards remain branded when a provider
// response does not include toolkit metadata.
const LOGO_DEFINITIONS: LogoDefinition[] = [
  { aliases: ["googlecalendar", "google_calendar", "calendar"], name: "Google Calendar", logo: "/logos/google-calendar.svg" },
  { aliases: ["googledrive", "google_drive"], name: "Google Drive", logo: "/logos/google-drive.svg" },
  { aliases: ["googledocs", "google_docs"], name: "Google Docs", logo: "/logos/google-docs.svg" },
  { aliases: ["googlesheets", "google_sheets"], name: "Google Sheets", logo: "/logos/google-sheets.svg" },
  { aliases: ["googlemeet", "google_meet"], name: "Google Meet", logo: "/logos/google-meet.svg" },
  { aliases: ["googlecontacts", "google_contacts"], name: "Google Contacts", logo: "/logos/google-contacts.png" },
  { aliases: ["googlebigquery", "google_bigquery"], name: "Google BigQuery", logo: "/logos/google_bigquery.svg" },
  { aliases: ["googlecloud", "google_cloud", "googlecloudrun", "google_cloud_run"], name: "Google Cloud", logo: "/logos/google-cloud-run.svg" },
  { aliases: ["gmail", "googlemail", "google_mail"], name: "Gmail", logo: "/logos/gmail.svg" },
  { aliases: ["github"], name: "GitHub", logo: "/logos/github.svg" },
  { aliases: ["gitlab"], name: "GitLab", logo: "/logos/gitlab.svg" },
  { aliases: ["bitbucket"], name: "Bitbucket", logo: "/logos/bitbucket.svg" },
  { aliases: ["slack"], name: "Slack", logo: "/logos/slack.svg" },
  { aliases: ["microsoftteams", "microsoft_teams", "teams"], name: "Microsoft Teams", logo: "/logos/microsoft-teams.svg" },
  { aliases: ["discord"], name: "Discord", logo: "/logos/discord.svg" },
  { aliases: ["telegram"], name: "Telegram", logo: "/logos/telegram.svg" },
  { aliases: ["whatsapp"], name: "WhatsApp", logo: "/logos/whatsapp.svg" },
  { aliases: ["outlook", "outlookmail", "outlook_mail"], name: "Outlook", logo: "/logos/outlook.svg" },
  { aliases: ["dropbox"], name: "Dropbox", logo: "/logos/dropbox.svg" },
  { aliases: ["onedrive", "one_drive"], name: "OneDrive", logo: "/logos/onedrive.svg" },
  { aliases: ["sharepoint", "share_point"], name: "SharePoint", logo: "/logos/sharepoint.svg" },
  { aliases: ["notion"], name: "Notion", logo: "/logos/notion.svg" },
  { aliases: ["linear"], name: "Linear", logo: "/logos/linear.svg" },
  { aliases: ["asana"], name: "Asana", logo: "/logos/asana.svg" },
  { aliases: ["trello"], name: "Trello", logo: "/logos/trello.svg" },
  { aliases: ["clickup", "click_up"], name: "ClickUp", logo: "/logos/clickup.svg" },
  { aliases: ["jira"], name: "Jira", logo: "/logos/jira.svg" },
  { aliases: ["confluence"], name: "Confluence", logo: "/logos/confluence.svg" },
  { aliases: ["monday", "mondaycom", "monday_com"], name: "Monday.com", logo: "/logos/monday.svg" },
  { aliases: ["vercel"], name: "Vercel", logo: "/logos/vercel.svg" },
  { aliases: ["railway"], name: "Railway", logo: "/logos/railway.svg" },
  { aliases: ["render"], name: "Render", logo: "/logos/render.png" },
  { aliases: ["netlify"], name: "Netlify", logo: "/logos/netlify.svg" },
  { aliases: ["cloudflare"], name: "Cloudflare", logo: "/logos/cloudflare.svg" },
  { aliases: ["aws", "amazonaws", "amazon_aws"], name: "AWS", logo: "/logos/aws.svg" },
  { aliases: ["amazon", "amazons3", "amazon_s3"], name: "Amazon S3", logo: "/logos/amazon-s3.svg" },
  { aliases: ["supabase"], name: "Supabase", logo: "/logos/supabase.svg" },
  { aliases: ["neon"], name: "Neon", logo: "/logos/neon.svg" },
  { aliases: ["postgres", "postgresql"], name: "PostgreSQL", logo: "/logos/postgresql.svg" },
  { aliases: ["mongodb", "mongo"], name: "MongoDB", logo: "/logos/mongodb.svg" },
  { aliases: ["stripe"], name: "Stripe", logo: "/logos/stripe.svg" },
  { aliases: ["paypal"], name: "PayPal", logo: "/logos/paypal.svg" },
  { aliases: ["shopify"], name: "Shopify", logo: "/logos/shopify.svg" },
  { aliases: ["salesforce"], name: "Salesforce", logo: "/logos/salesforce.svg" },
  { aliases: ["hubspot"], name: "HubSpot", logo: "/logos/hubspot.svg" },
  { aliases: ["mailchimp"], name: "Mailchimp", logo: "/logos/mailchimp.svg" },
  { aliases: ["sendgrid"], name: "SendGrid", logo: "/logos/sendgrid.svg" },
  { aliases: ["intercom"], name: "Intercom", logo: "/logos/intercom.svg" },
  { aliases: ["zendesk"], name: "Zendesk", logo: "/logos/zendesk.svg" },
  { aliases: ["zoom"], name: "Zoom", logo: "/logos/zoom.svg" },
  { aliases: ["calendly"], name: "Calendly", logo: "/logos/calendly.svg" },
  { aliases: ["docusign", "docu_sign"], name: "DocuSign", logo: "/logos/docusign.png" },
  { aliases: ["instagram"], name: "Instagram", logo: "/logos/instagram.svg" },
  { aliases: ["facebook"], name: "Facebook", logo: "/logos/facebook.svg" },
  { aliases: ["linkedin"], name: "LinkedIn", logo: "/logos/linkedin.svg" },
  { aliases: ["reddit"], name: "Reddit", logo: "/logos/reddit.svg" },
  { aliases: ["youtube"], name: "YouTube", logo: "/logos/youtube.svg" },
  { aliases: ["x", "twitter", "x_twitter"], name: "X", logo: "/logos/x-twitter.svg" },
  { aliases: ["spotify"], name: "Spotify", logo: "/logos/spotify.png" },
  { aliases: ["treg"], name: "Treg", logo: "/logos/treg.svg" },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function triggerProviderBrand(slug: string): TriggerProviderBrand {
  const normalized = normalize(slug);
  const definition = LOGO_DEFINITIONS.find(({ aliases }) => aliases.some((alias) => normalized.startsWith(normalize(alias))));
  if (definition) return { name: definition.name, logo: definition.logo };

  const provider = slug.split(/[_:.\-/]/)[0]?.trim() || "connected app";
  return { name: provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase() };
}

export function TriggerLogo({ slug, size = 32 }: { slug: string; size?: number }) {
  const brand = triggerProviderBrand(slug);
  return <ToolkitLogo name={brand.name} logo={brand.logo} size={size} />;
}
