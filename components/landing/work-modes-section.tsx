"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ListChecks, PhoneCall } from "lucide-react";

const workModes = [
  {
    label: "Meetings",
    meta: "Supported meeting providers",
    title: "Join and contribute",
    description: "Chusky can join a meeting link, introduce itself, answer questions, and capture what matters.",
    icon: CalendarDays,
  },
  {
    label: "Phone calls",
    meta: "When a voice provider is configured",
    title: "A voice for approved calls",
    description: "Handle approved outbound calls and calls from approved numbers with a clear brief and safe boundaries.",
    icon: PhoneCall,
  },
  {
    label: "Follow-through",
    meta: "Recaps · tasks · reminders",
    title: "Keep the next step moving",
    description: "Turn conversations into private recaps, action items, reminders, and agreed follow-up work.",
    icon: ListChecks,
  },
];

export function WorkModesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.12 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-y border-foreground/10 py-16 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute right-[-8rem] top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border border-chusky-amber/20 sm:right-[-5rem]" />
      <div className="pointer-events-none absolute right-16 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border border-chusky-amber/10" />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 sm:gap-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-24 lg:px-12">
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
          }`}
        >
          <span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6 sm:text-sm">
            <span className="h-px w-8 bg-foreground/30" />
            Beyond chat
          </span>
          <h2 className="max-w-xl font-display text-3xl leading-[0.96] tracking-tight sm:text-4xl lg:text-5xl">
            Chusky shows up where work happens.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-7 sm:text-lg">
            Join a meeting, handle a phone call, or turn a conversation into useful next steps. Chusky can speak, listen, and act within the boundaries you set.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
            {["Provider-enabled", "Owner-scoped", "Reviewable"].map((value) => (
              <div key={value} className="border border-foreground/10 px-3 py-3 text-[10px] leading-tight text-muted-foreground sm:px-4 sm:py-4 sm:text-xs">
                <div className="font-medium text-foreground">{value}</div>
                <div className="mt-1">Availability depends on workspace configuration.</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`relative overflow-hidden border border-foreground/10 bg-background transition-all delay-150 duration-700 ${
            isVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3.5 sm:px-5 sm:py-4">
            <span className="text-xs font-mono text-muted-foreground sm:text-sm">Chusky work modes</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Available when enabled
            </span>
          </div>

          <div>
            {workModes.map(({ label, meta, title, description, icon: Icon }, index) => (
              <div
                key={label}
                className="group border-b border-foreground/10 px-4 py-4 transition-colors last:border-0 hover:bg-foreground/[0.025] sm:px-5 sm:py-5"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/15 text-foreground transition-colors group-hover:border-chusky-amber group-hover:text-chusky-amber sm:h-9 sm:w-9">
                    <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="text-sm font-medium sm:text-base">{label}</h3>
                      <span className="font-mono text-[9px] text-muted-foreground sm:text-[10px]">0{index + 1}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-chusky-amber sm:text-[11px]">{meta}</p>
                    <p className="mt-2 text-xs font-medium sm:text-sm">{title}</p>
                    <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{description}</p>
                  </div>
                  <Check className="mt-1 hidden shrink-0 text-emerald-600 sm:block" size={14} aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
