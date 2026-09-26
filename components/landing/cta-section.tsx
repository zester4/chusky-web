"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnimatedTetrahedron } from "./animated-tetrahedron";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div
          className={`relative border border-foreground transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          onMouseMove={handleMouseMove}
        >
          {/* Spotlight effect */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,0,0,0.15), transparent 40%)`
            }}
          />
          
          <div className="relative z-10 px-4 py-10 sm:px-8 sm:py-14 lg:px-16 lg:py-24">
            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row lg:gap-12">
              {/* Left content */}
              <div className="flex-1">
                <h2 className="mb-6 text-3xl font-display leading-[0.95] tracking-tight sm:mb-8 lg:text-6xl">
                  Bring a real task.
                  <br />
                  Start with one workflow.
                </h2>

                <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-xl">
                  Create an account to see Chusky&apos;s current capabilities, then connect only the apps and providers your work needs.
                </p>

                <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-start sm:gap-4">
                  <Button asChild size="lg" className="h-11 rounded-full bg-foreground px-5 text-sm text-background group hover:bg-foreground/90 sm:h-12 sm:px-7 sm:text-base">
                    <Link href="/sign-up">Create an account <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-foreground/20 px-5 text-sm hover:bg-foreground/5 sm:h-12 sm:px-7 sm:text-base">
                    <Link href="/docs">Read the docs</Link>
                  </Button>
                </div>

              </div>

              {/* Right animation */}
              <div className="hidden lg:flex items-center justify-center w-[500px] h-[500px] -mr-16">
                <AnimatedTetrahedron />
              </div>
            </div>
          </div>

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-t border-r border-foreground/10" />
        </div>
      </div>
    </section>
  );
}
