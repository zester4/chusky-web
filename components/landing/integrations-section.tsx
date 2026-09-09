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
    <section id="integrations" ref={sectionRef} className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-24 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6 sm:text-sm">
            <span className="w-8 h-px bg-foreground/30" />
            Integrations
            <span className="w-8 h-px bg-foreground/30" />
          </span>
          <h2 className="mb-5 text-4xl font-display tracking-tight sm:mb-6 lg:text-6xl">
            Works with everything
            <br />
            you already use.
          </h2>
          <p className="text-xl text-muted-foreground">
            200+ pre-built integrations. Connect your entire stack in minutes.
          </p>
        </div>

      </div>
      
      {/* Full-width marquees outside container */}
      <div className="w-full mb-6">
        <div className="flex gap-6 marquee">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {integrations.map((integration) => (
                <div
                  key={`${integration.name}-${setIndex}`}
                  className="shrink-0 border border-foreground/10 px-5 py-4 transition-all duration-300 group hover:border-foreground/30 hover:bg-foreground/[0.02] sm:px-8 sm:py-6"
                >
                  <div className="flex items-center gap-3 text-lg font-medium transition-transform group-hover:translate-x-1">
                    <Image src={integration.logo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                    {integration.name}
                  </div>
                  <div className="ml-10 text-sm text-muted-foreground">{integration.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Reverse marquee */}
      <div className="w-full">
        <div className="flex gap-6 marquee-reverse">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {[...integrations].reverse().map((integration) => (
                <div
                  key={`${integration.name}-reverse-${setIndex}`}
                  className="shrink-0 border border-foreground/10 px-5 py-4 transition-all duration-300 group hover:border-foreground/30 hover:bg-foreground/[0.02] sm:px-8 sm:py-6"
                >
                  <div className="flex items-center gap-3 text-lg font-medium transition-transform group-hover:translate-x-1">
                    <Image src={integration.logo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                    {integration.name}
                  </div>
                  <div className="ml-10 text-sm text-muted-foreground">{integration.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
