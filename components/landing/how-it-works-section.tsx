"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Connect your tools",
    description: "Integrate with your existing stack in minutes. We support 200+ data sources out of the box.",
    code: `import { chusky } from '@chusky/core'

chusky.connect({
  source: 'your-database',
  sync: true
})`,
  },
  {
    number: "II",
    title: "Build your workflow",
    description: "Design powerful automations with our visual builder or write code directly.",
    code: `chusky.workflow('process', {
  trigger: 'event',
  actions: [
    'validate',
    'transform', 
    'deliver'
  ]
})`,
  },
  {
    number: "III",
    title: "Ship to production",
    description: "Deploy globally with zero configuration. Your app goes live in under 30 seconds.",
    code: `chusky.deploy({
  target: 'production',
  regions: 'auto'
})

// Deployed to 12 regions`,
  },
  {
    number: "IV",
    title: "Keep context close",
    description: "Chusky keeps your private history, explicit memories, reminders, and scratchpad scoped to your account—not mixed into shared channel conversations.",
    code: `session = chusky.session(user)
session.memory.search("launch plan")
session.scratchpad.read("next")`,
  },
  {
    number: "V",
    title: "Approve the important parts",
    description: "When work would send, publish, delete, or change something externally, Chusky pauses and asks you to approve the exact action.",
    code: `approval = chusky.approval.pending()
approval.review({ exact: true })
approval.resume("approve")`,
  },
  {
    number: "VI",
    title: "Deliver where you are",
    description: "One agent can respond through Telegram, CLI, Slack, WhatsApp, or iMessage—with durable delivery, retries, and provider-aware formatting.",
    code: `chusky.deliver({
  channels: ['telegram', 'sendblue'],
  durable: true
})`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative overflow-hidden bg-foreground py-16 text-background sm:py-20 lg:py-24"
    >
      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            currentColor 40px,
            currentColor 41px
          )`
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10 sm:mb-14 lg:mb-16">
          <span className="mb-4 inline-flex items-center gap-3 text-xs font-mono text-background/50 sm:mb-5 sm:text-sm">
            <span className="h-px w-6 bg-background/30 sm:w-8" />
            Process
          </span>
          <h2
            className={`text-3xl font-display tracking-tight transition-all duration-700 sm:text-4xl lg:text-5xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Three steps.
            <br />
            <span className="text-background/50">Infinite possibilities.</span>
          </h2>
        </div>

        {/* Main content */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full border-b border-background/10 py-5 text-left transition-all duration-500 group sm:py-6 ${
                  activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="font-display text-2xl text-background/30">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="mb-2 font-display text-xl transition-transform duration-300 group-hover:translate-x-2 sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-background/60">
                      {step.description}
                    </p>
                    
                    {/* Progress indicator */}
                    {activeStep === index && (
                      <div className="mt-4 h-px bg-background/20 overflow-hidden">
                        <div 
                          className="h-full bg-background w-0"
                          style={{
                            animation: 'progress 5s linear forwards'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Code display */}
          <div className="lg:sticky lg:top-32 self-start">
            <div className="overflow-hidden border border-background/10">
              {/* Window header */}
              <div className="flex items-center justify-between border-b border-background/10 px-4 py-3 sm:px-5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                </div>
                <span className="text-xs font-mono text-background/40">workflow.ts</span>
              </div>

              {/* Code content */}
              <div className="min-h-[240px] overflow-x-auto p-5 font-mono text-xs sm:min-h-[260px] sm:p-6 sm:text-sm">
                <pre className="text-background/70">
                  {steps[activeStep].code.split('\n').map((line, lineIndex) => (
                    <div 
                      key={`${activeStep}-${lineIndex}`} 
                      className="leading-loose code-line-reveal"
                      style={{ 
                        animationDelay: `${lineIndex * 80}ms`,
                      }}
                    >
                      <span className="text-background/20 select-none w-8 inline-block">{lineIndex + 1}</span>
                      <span className="inline-flex">
                        {line.split('').map((char, charIndex) => (
                          <span
                            key={`${activeStep}-${lineIndex}-${charIndex}`}
                            className="code-char-reveal"
                            style={{
                              animationDelay: `${lineIndex * 80 + charIndex * 15}ms`,
                            }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 border-t border-background/10 px-4 py-3 sm:px-5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-background/40">Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-background/10 pt-7 sm:mt-16 sm:pt-9 lg:mt-20">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/40">The Chusky loop</span>
              <h3 className="mt-3 max-w-sm text-2xl font-display tracking-tight sm:text-3xl">Useful work, with a safe way back in.</h3>
            </div>
            <div className="grid gap-px border border-background/10 bg-background/10 sm:grid-cols-2 lg:grid-cols-4">
              {["Verify the channel", "Run the agent", "Pause for approval", "Deliver and recover"].map((item, index) => (
                <div key={item} className="bg-foreground p-5">
                  <span className="font-mono text-[10px] text-background/35">0{index + 1}</span>
                  <p className="mt-6 text-xs leading-relaxed text-background/70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .code-line-reveal {
          opacity: 0;
          transform: translateX(-8px);
          animation: lineReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        
        @keyframes lineReveal {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .code-char-reveal {
          opacity: 0;
          filter: blur(8px);
          animation: charReveal 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        
        @keyframes charReveal {
          to {
            opacity: 1;
            filter: blur(0);
          }
        }
      `}</style>
    </section>
  );
}
