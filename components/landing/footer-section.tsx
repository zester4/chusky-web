"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AnimatedWave } from "./animated-wave";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "How it works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "Integrations", href: "/features#integrations" },
  ],
  Developers: [
    { name: "Documentation", href: "/developers" },
    { name: "API Reference", href: "#" },
    { name: "SDK", href: "/developers" },
    { name: "Status", href: "#" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#", badge: "Hiring" },
    { name: "Contact", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Security", href: "#security" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "#" },
  { name: "GitHub", href: "#" },
  { name: "LinkedIn", href: "#" },
];

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-64 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-6 lg:gap-7">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="mb-4 inline-flex items-center gap-2">
                <span className="font-display text-xl">Chusky</span>
                <span className="font-mono text-[10px] text-muted-foreground">TM</span>
              </Link>

              <p className="mb-6 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Chusky is a production-ready Telegram AI agent with access to 1,000+ tools via Composio.
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="mb-4 text-xs font-medium sm:text-sm">{title}</h3>
                <ul className="space-y-2.5 sm:space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                      >
                        {link.name}
                        {"badge" in link && link.badge && (
                          <span className="text-xs px-2 py-0.5 bg-foreground text-background rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            2025 Chusky. All rights reserved.
          </p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
