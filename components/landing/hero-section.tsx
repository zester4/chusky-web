"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative flex min-h-[680px] flex-col justify-center overflow-hidden lg:min-h-screen">
      {/* Animated sphere background */}
      <div className="pointer-events-none absolute right-[-12rem] top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-30 sm:right-[-8rem] sm:h-[520px] sm:w-[520px] lg:right-0 lg:h-[800px] lg:w-[800px] lg:opacity-40">
        <AnimatedSphere />
      </div>
      
      {/* Subtle grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground/10"
            style={{
              top: `${12.5 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-foreground/10"
            style={{
              left: `${8.33 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-20 sm:px-6 sm:py-28 lg:px-12 lg:py-40">
        {/* Eyebrow */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:text-sm">
            <span className="h-px w-6 bg-foreground/30 sm:w-8" />
            THE CHUSKY AGENT
          </span>
        </div>
        
        {/* Main headline */}
        <div className="mb-8 sm:mb-10">
          <h1 
            className={`text-[clamp(2.6rem,11vw,7rem)] font-display leading-[0.9] tracking-tight transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">An agent for</span>
            <span className="block text-muted-foreground">work that moves.</span>
          </h1>
        </div>
        
        {/* Description */}
        <div className="grid items-end gap-8 lg:grid-cols-2 lg:gap-20">
          <p 
            className={`max-w-xl text-base leading-relaxed text-muted-foreground transition-all duration-700 delay-200 sm:text-lg lg:text-xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Chusky turns a request into visible, multi-step work. It can research, use the apps you connect, create deliverables, and keep longer tasks moving—with review points when an action needs your approval.
          </p>
          
          {/* CTAs */}
          <div 
            className={`flex flex-row items-center gap-2 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button asChild size="lg" className="h-10 shrink-0 rounded-full bg-foreground px-4 text-xs text-background group hover:bg-foreground/90 sm:h-11 sm:px-5 sm:text-sm">
              <Link href="/sign-up">Create an account <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:ml-2 sm:h-4 sm:w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 shrink-0 rounded-full border-foreground/20 px-4 text-xs hover:bg-foreground/5 sm:h-11 sm:px-5 sm:text-sm">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
        
      </div>
      
    </section>
  );
}
