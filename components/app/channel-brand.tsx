"use client";

import { ToolkitLogo } from "./toolkit-logo";

export type ChannelProvider = "telegram" | "slack" | "whatsapp" | "sendblue" | "sms" | "x" | "xchat";

type ChannelBrand = { name: string; logo: string; description: string };

const CHANNEL_BRANDS: Record<ChannelProvider, ChannelBrand> = {
  telegram: { name: "Telegram", logo: "/logos/telegram.svg", description: "Your primary Chusky workspace" },
  slack: { name: "Slack", logo: "/logos/slack.svg", description: "Direct messages and workspace delivery" },
  whatsapp: { name: "WhatsApp", logo: "/logos/whatsapp.svg", description: "Private messages and approved delivery" },
  sendblue: { name: "iMessage", logo: "/logos/imessage.svg", description: "Private iMessage delivery" },
  sms: { name: "SMS", logo: "/logos/twilio.svg", description: "SMS through Twilio" },
  x: { name: "X Direct Messages", logo: "/logos/x-twitter.svg", description: "Private X messages" },
  xchat: { name: "Encrypted XChat", logo: "/logos/x-twitter.svg", description: "Encrypted X messaging" },
};

export function channelBrand(provider: string): ChannelBrand {
  return CHANNEL_BRANDS[provider as ChannelProvider] ?? { name: provider, logo: "/logos/chat.svg", description: "Connected channel" };
}

export function ChannelLogo({ provider, size = 32 }: { provider: string; size?: number }) {
  const brand = channelBrand(provider);
  return <ToolkitLogo name={brand.name} logo={brand.logo} size={size} />;
}
