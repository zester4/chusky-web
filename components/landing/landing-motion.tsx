"use client";

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing-motion]");
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-motion-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!root || reducedMotion.matches || !("IntersectionObserver" in window) || targets.length === 0) {
      return;
    }

    root.dataset.motionReady = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.dataset.motionVisible = "true";
          observer.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      delete root.dataset.motionReady;
      targets.forEach((target) => delete target.dataset.motionVisible);
    };
  }, []);

  return null;
}
