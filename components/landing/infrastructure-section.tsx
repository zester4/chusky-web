"use client";

import { useEffect, useState, useRef } from "react";

const locations = [
  { city: "San Francisco", region: "US West", latency: "12ms" },
  { city: "New York", region: "US East", latency: "18ms" },
  { city: "London", region: "Europe", latency: "24ms" },
  { city: "Tokyo", region: "Asia Pacific", latency: "32ms" },
  { city: "Sydney", region: "Oceania", latency: "45ms" },
  { city: "Sao Paulo", region: "South America", latency: "38ms" },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeLocation, setActiveLocation] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocation((prev) => (prev + 1) % locations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6 sm:text-sm">
              <span className="w-8 h-px bg-foreground/30" />
              Infrastructure
            </span>
            <h2 className="mb-6 text-4xl font-display tracking-tight sm:mb-8 lg:text-6xl">
              Global by
              <br />
              default.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-xl">
              Deploy once, run everywhere. Our edge network spans 17 data centers 
              across 6 continents, delivering sub-50ms latency to 99% of the world.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-8">
              <div>
                <div className="mb-1 text-3xl font-display sm:text-4xl lg:text-5xl">17</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Data centers</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-display sm:text-4xl lg:text-5xl">99.99%</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Uptime SLA</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-display sm:text-4xl lg:text-5xl">&lt;50ms</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Global latency</div>
              </div>
            </div>
          </div>

          {/* Right: Location list */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-foreground/10 px-3.5 py-3 sm:px-5 sm:py-4">
                <span className="text-sm font-mono text-muted-foreground">Edge Network</span>
                <span className="flex items-center gap-2 text-xs font-mono text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  All operational
                </span>
              </div>

              {/* Locations */}
              <div>
                {locations.map((location, index) => (
                  <div
                    key={location.city}
                    className={`flex items-center justify-between gap-3 border-b border-foreground/5 px-3.5 py-3.5 transition-all duration-300 last:border-b-0 sm:px-5 sm:py-4 ${
                      activeLocation === index ? "bg-foreground/[0.02]" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <span 
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          activeLocation === index ? "bg-foreground" : "bg-foreground/20"
                        }`}
                      />
                      <div>
                        <div className="truncate text-sm font-medium">{location.city}</div>
                        <div className="text-xs text-muted-foreground sm:text-sm">{location.region}</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{location.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
