"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "Instant Deployment",
    description: "Push to production in seconds. Our edge network ensures your applications load instantly, anywhere in the world.",
    visual: "deploy",
  },
  {
    number: "02",
    title: "AI-Native Workflows",
    description: "Build intelligent applications with built-in AI capabilities. From inference to training, everything scales automatically.",
    visual: "ai",
  },
  {
    number: "03",
    title: "Real-time Collaboration",
    description: "Work together seamlessly. Live preview, instant feedback, and version control that actually makes sense.",
    visual: "collab",
  },
  {
    number: "04",
    title: "Enterprise Security",
    description: "Bank-grade encryption, SOC 2 compliance, and granular access controls. Your data stays yours.",
    visual: "security",
  },
  {
    number: "05",
    title: "Every channel, one agent",
    description: "Move between Telegram, CLI, Slack, WhatsApp, and Sendblue without splitting your agent’s core behavior. Each provider gets the right formatting, permissions, and delivery path.",
    visual: "ai",
  },
  {
    number: "06",
    title: "Durable by default",
    description: "Reminders, recurring jobs, long-running tasks, triggers, and outbound messages survive retries and restarts with Redis and workflow-backed state.",
    visual: "deploy",
  },
  {
    number: "07",
    title: "Human control where it matters",
    description: "Risky actions pause for exact, one-time approval. The request, arguments, owner, expiry, and result stay bound together from review to execution.",
    visual: "security",
  },
  {
    number: "08",
    title: "Media that goes further",
    description: "Send images, audio, documents, and generated artifacts through the right model path. R2 keeps files durable while providers receive safe HTTPS media URLs.",
    visual: "collab",
  },
];

function DeployVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <defs>
        <clipPath id="deployClip">
          <rect x="30" y="20" width="140" height="120" rx="4" />
        </clipPath>
      </defs>
      
      {/* Container */}
      <rect x="30" y="20" width="140" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* Animated bars */}
      <g clipPath="url(#deployClip)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x="40"
            y={35 + i * 16}
            width="120"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.15"
          >
            <animate
              attributeName="opacity"
              values="0.15;0.8;0.15"
              dur="2s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="width"
              values="20;120;20"
              dur="2s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
      </g>
      
      {/* Progress indicator */}
      <circle cx="100" cy="155" r="3" fill="currentColor" opacity="0.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

const aiNodePositions = [
  { x: 150, y: 80 },
  { x: 125, y: 123.3 },
  { x: 75, y: 123.3 },
  { x: 50, y: 80 },
  { x: 75, y: 36.7 },
  { x: 125, y: 36.7 },
];

function AIVisual() {

  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Central node */}
      <circle cx="100" cy="80" r="12" fill="currentColor">
        <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
      </circle>
      
      {/* Orbiting nodes */}
      {aiNodePositions.map((position, i) => {
        return (
          <g key={i}>
            {/* Connection line */}
            <line
              x1="100"
              y1="80"
              x2={position.x}
              y2={position.y}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="2s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </line>
            
            {/* Outer node */}
            <circle
              cx={position.x}
              cy={position.y}
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <animate
                attributeName="r"
                values="6;8;6"
                dur="2s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
      
      {/* Pulse rings */}
      <circle cx="100" cy="80" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0">
        <animate attributeName="r" values="20;60" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function CollabVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* User A */}
      <g>
        <rect x="30" y="50" width="50" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="55" y="85" textAnchor="middle" fontSize="20" fontFamily="monospace" fill="currentColor">A</text>
        <circle cx="55" cy="35" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
      
      {/* User B */}
      <g>
        <rect x="120" y="50" width="50" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="145" y="85" textAnchor="middle" fontSize="20" fontFamily="monospace" fill="currentColor">B</text>
        <circle cx="145" cy="35" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
      
      {/* Connection */}
      <line x1="80" y1="80" x2="120" y2="80" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="0.5s" repeatCount="indefinite" />
      </line>
      
      {/* Data packet */}
      <circle r="4" fill="currentColor">
        <animateMotion dur="1.5s" repeatCount="indefinite">
          <mpath href="#dataPath" />
        </animateMotion>
      </circle>
      <path id="dataPath" d="M 80 80 L 120 80" fill="none" />
      
      {/* Sync indicator */}
      <g transform="translate(100, 130)">
        <circle r="6" fill="none" stroke="currentColor" strokeWidth="2">
          <animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

function SecurityVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Shield */}
      <path
        d="M 100 20 L 150 40 L 150 90 Q 150 130 100 145 Q 50 130 50 90 L 50 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Inner shield */}
      <path
        d="M 100 35 L 135 50 L 135 85 Q 135 115 100 128 Q 65 115 65 85 L 65 50 Z"
        fill="currentColor"
        opacity="0.1"
      >
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite" />
      </path>
      
      {/* Lock icon */}
      <rect x="85" y="70" width="30" height="25" rx="3" fill="currentColor" />
      <path
        d="M 90 70 L 90 60 Q 90 50 100 50 Q 110 50 110 60 L 110 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Keyhole */}
      <circle cx="100" cy="80" r="4" fill="white" />
      <rect x="98" y="82" width="4" height="8" fill="white" />
      
      {/* Scan lines */}
      <line x1="60" y1="60" x2="140" y2="60" stroke="currentColor" strokeWidth="1" opacity="0">
        <animate attributeName="y1" values="40;120;40" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y2" values="40;120;40" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.5;0" dur="3s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "deploy":
      return <DeployVisual />;
    case "ai":
      return <AIVisual />;
    case "collab":
      return <CollabVisual />;
    case "security":
      return <SecurityVisual />;
    default:
      return <DeployVisual />;
  }
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col gap-6 border-b border-foreground/10 py-8 sm:py-10 lg:flex-row lg:gap-12 lg:py-14">
        {/* Number */}
        <div className="shrink-0">
          <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
        </div>
        
        {/* Content */}
        <div className="grid flex-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <h3 className="mb-3 font-display text-2xl transition-transform duration-500 group-hover:translate-x-2 sm:text-3xl">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {feature.description}
            </p>
          </div>
          
          {/* Visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="h-32 w-40 text-foreground sm:h-36 sm:w-44">
              <AnimatedVisual type={feature.visual} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
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

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10 sm:mb-14 lg:mb-16">
          <span className="mb-4 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-5 sm:text-sm">
            <span className="h-px w-6 bg-foreground/30 sm:w-8" />
            Capabilities
          </span>
          <h2
            className={`text-3xl font-display tracking-tight transition-all duration-700 sm:text-4xl lg:text-5xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don&apos;t.</span>
          </h2>
        </div>

        {/* Features List */}
        <div>
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>

        <div className="mt-12 grid gap-3 border-t border-foreground/10 pt-6 sm:grid-cols-3 lg:mt-16">
          {[{ label: "Context", value: "Private sessions, memories, and scratchpad" }, { label: "Control", value: "Approvals before external side effects" }, { label: "Continuity", value: "Redis state, retries, and durable workflows" }].map((item) => (
            <div key={item.label} className="border border-foreground/10 p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</span>
              <p className="mt-3 text-xs leading-relaxed sm:text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
