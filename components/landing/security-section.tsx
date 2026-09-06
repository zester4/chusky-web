"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "SOC 2 Type II",
    description: "Independently audited security controls with continuous monitoring.",
  },
  {
    icon: Lock,
    title: "End-to-end encryption",
    description: "AES-256 encryption for data at rest and TLS 1.3 in transit.",
  },
  {
    icon: Eye,
    title: "Zero-trust architecture",
    description: "Every request is authenticated and authorized. No exceptions.",
  },
  {
    icon: FileCheck,
    title: "GDPR & HIPAA",
    description: "Full compliance with data protection and healthcare regulations.",
  },
];

const certifications = ["SOC 2", "ISO 27001", "HIPAA", "GDPR", "CCPA"];

export function SecuritySection() {
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
    <section id="security" ref={sectionRef} className="relative overflow-hidden bg-foreground/[0.02] py-16 sm:py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="grid gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6 sm:text-sm">
              <span className="w-8 h-px bg-foreground/30" />
              Security
            </span>
            <h2 className="mb-6 text-4xl font-display tracking-tight sm:mb-8 lg:text-6xl">
              Trust is
              <br />
              non-negotiable.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-xl">
              Enterprise-grade security isn&apos;t optional. It&apos;s built into every layer 
              of our platform, from infrastructure to application.
            </p>

            {/* Certifications */}
            <div className="flex flex-wrap gap-3">
              {certifications.map((cert, index) => (
                <span
                  key={cert}
                  className={`border border-foreground/10 px-3 py-1.5 text-xs font-mono transition-all duration-500 sm:px-4 sm:py-2 sm:text-sm ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Features */}
          <div className="grid gap-3 sm:gap-4">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`border border-foreground/10 p-4 transition-all duration-500 group hover:border-foreground/20 sm:p-5 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center border border-foreground/10 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 group-hover:translate-x-1 transition-transform duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
