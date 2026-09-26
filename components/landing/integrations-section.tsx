"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const integrations = [
  { name: "GitHub", category: "Version Control", logo: "/logos/github-official.svg" },
  { name: "Slack", category: "Communication", logo: "/logos/brand-slack.svg" },
  { name: "Stripe", category: "Payments", logo: "/logos/brand-stripe.svg" },
  { name: "PostgreSQL", category: "Database", logo: "/logos/brand-postgresql.svg" },
  { name: "Gmail", category: "Email", logo: "/logos/brand-gmail.svg" },
  { name: "AWS", category: "Cloud", logo: "/logos/brand-aws.svg" },
  { name: "MongoDB", category: "Database", logo: "/logos/brand-mongodb.svg" },
  { name: "Google Calendar", category: "Scheduling", logo: "/logos/brand-google-calendar.svg" },
  { name: "Figma", category: "Design", logo: "/logos/figma.svg" },
  { name: "Linear", category: "Project Management", logo: "/logos/brand-linear.svg" },
  { name: "Notion", category: "Documentation", logo: "/logos/notion.svg" },
  { name: "Dropbox", category: "Files", logo: "/logos/brand-dropbox.svg" },
];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="integrations" ref={sectionRef} className="relative overflow-hidden border-y border-foreground/10 py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-24 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
            <span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6 sm:text-sm">
              <span className="w-8 h-px bg-foreground/30" />
              EXAMPLES FROM THE CONNECTED-APP CATALOG
          </span>
          <h2 className="mb-5 text-3xl font-display tracking-tight sm:mb-6 lg:text-5xl">
            Connect the apps
            <br />
            your work depends on.
          </h2>
          <p className="text-xl text-muted-foreground">
            These examples are not a guarantee that every action is available in every workspace. Chusky can use an app only after it is connected and the required action is enabled.
          </p>
        </div>

      </div>
      
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 sm:grid-cols-3 sm:gap-3 sm:px-6 lg:grid-cols-4 lg:px-12">
        {integrations.map((integration) => (
          <article key={integration.name} className="border border-foreground/10 p-4 transition-colors hover:border-foreground/30 sm:p-5">
            <div className="flex items-center gap-3 text-sm font-medium sm:text-base">
              <Image src={integration.logo} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" />
              {integration.name}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{integration.category}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
