"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";

const words = ["create", "build", "scale", "ship"];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
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
      
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-24 sm:px-6 sm:py-28 lg:px-12 lg:py-40">
        {/* Eyebrow */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:text-sm">
            <span className="h-px w-6 bg-foreground/30 sm:w-8" />
            Production-ready Telegram AI agent
          </span>
        </div>
        
        {/* Main headline */}
        <div className="mb-8 sm:mb-10">
          <h1 
            className={`text-[clamp(2.75rem,12vw,8rem)] font-display leading-[0.9] tracking-tight transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">Your AI agent</span>
            <span className="block">
              to{" "}
              <span className="relative inline-block">
                <span 
                  key={wordIndex}
                  className="inline-flex"
                >
                  {words[wordIndex].split("").map((char, i) => (
                    <span
                      key={`${wordIndex}-${i}`}
                      className="inline-block animate-char-in"
                      style={{
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-foreground/10" />
              </span>
            </span>
          </h1>
        </div>
        
        {/* Description */}
        <div className="grid items-end gap-8 lg:grid-cols-2 lg:gap-20">
          <p 
            className={`max-w-xl text-base leading-relaxed text-muted-foreground transition-all duration-700 delay-200 sm:text-lg lg:text-xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Your toolkit to stop configuring and start innovating. 
            Access 1,000+ tools through Composio, powered by any OpenRouter model. Connect apps, browse the web, run commands, and automate work from Telegram.
          </p>
          
          {/* CTAs */}
          <div 
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button 
              size="lg" 
              className="h-11 rounded-full bg-foreground px-5 text-sm text-background group hover:bg-foreground/90"
            >
              Start free trial
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-11 rounded-full border-foreground/20 px-5 text-sm hover:bg-foreground/5"
            >
              Watch demo
            </Button>
          </div>
        </div>
        
      </div>
      
      {/* Stats marquee - full width outside container */}
      <div 
        className={`absolute bottom-12 left-0 right-0 transition-all duration-700 delay-500 sm:bottom-16 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex gap-10 marquee whitespace-nowrap sm:gap-16">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {[
                { value: "20 days", label: "saved on builds", company: "NETFLIX" },
                { value: "98%", label: "faster deployment", company: "STRIPE" },
                { value: "300%", label: "throughput increase", company: "LINEAR" },
                { value: "6x", label: "faster to ship", company: "NOTION" },
              ].map((stat) => (
                <div key={`${stat.company}-${i}`} className="flex items-baseline gap-3">
                  <span className="font-display text-2xl sm:text-4xl lg:text-5xl">{stat.value}</span>
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
                    <span className="mt-1 block font-mono text-[10px] sm:text-xs">{stat.company}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}
      
    </section>
  );
}
