"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

const codeExamples = [
  {
    label: "Install",
    code: `npm install @chusky/sdk

# or
yarn add @chusky/sdk
pnpm add @chusky/sdk`,
  },
  {
    label: "Initialize",
    code: `import { Chusky } from '@chusky/sdk'

const chusky = new Chusky({
  apiKey: process.env.CHUSKY_API_KEY
})`,
  },
  {
    label: "Deploy",
    code: `const app = await chusky.deploy({
  name: 'my-app',
  region: 'auto',
  scaling: {
    min: 1,
    max: 100
  }
})

console.log('Live at:', app.url)`,
  },
];

const features = [
  { 
    title: "TypeScript native", 
    description: "Full type safety with auto-generated types."
  },
  { 
    title: "Zero config", 
    description: "Sensible defaults that just work."
  },
  { 
    title: "Edge-ready", 
    description: "Runs anywhere: Node, Deno, Bun, browsers."
  },
  { 
    title: "12KB gzipped", 
    description: "Lightweight with zero dependencies."
  },
];

const codeAnimationStyles = `
  .dev-code-line {
    opacity: 0;
    transform: translateX(-8px);
    animation: devLineReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes devLineReveal {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .dev-code-char {
    opacity: 0;
    filter: blur(8px);
    animation: devCharReveal 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes devCharReveal {
    to {
      opacity: 1;
      filter: blur(0);
    }
  }
`;

export function DevelopersSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <section id="developers" ref={sectionRef} className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
      <style dangerouslySetInnerHTML={{ __html: codeAnimationStyles }} />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="grid items-start gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="mb-5 inline-flex items-center gap-3 text-xs font-mono text-muted-foreground sm:mb-6 sm:text-sm">
              <span className="w-8 h-px bg-foreground/30" />
              For developers
            </span>
            <h2 className="mb-6 text-4xl font-display tracking-tight sm:mb-8 lg:text-6xl">
              Built by devs.
              <br />
              <span className="text-muted-foreground">For devs.</span>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-xl">
              A thoughtfully designed SDK that gets out of your way. 
              Ship faster with intuitive APIs and exceptional documentation.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: Code block */}
          <div
            className={`lg:sticky lg:top-32 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              {/* Tabs */}
              <div className="flex items-center border-b border-foreground/10">
                {codeExamples.map((example, idx) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-3 text-xs font-mono transition-colors relative sm:px-5 sm:py-4 sm:text-sm ${
                      activeTab === idx
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {example.label}
                    {activeTab === idx && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                    )}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-3 text-muted-foreground transition-colors hover:text-foreground sm:px-4 sm:py-4"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Code content */}
              <div className="min-h-[200px] overflow-x-auto bg-foreground/[0.01] p-4 font-mono text-[11px] sm:min-h-[220px] sm:p-6 sm:text-sm">
                <pre className="text-foreground/80">
                  {codeExamples[activeTab].code.split('\n').map((line, lineIndex) => (
                    <div 
                      key={`${activeTab}-${lineIndex}`} 
                      className="leading-loose dev-code-line"
                      style={{ animationDelay: `${lineIndex * 80}ms` }}
                    >
                      <span className="inline-flex">
                        {line.split('').map((char, charIndex) => (
                          <span
                            key={`${activeTab}-${lineIndex}-${charIndex}`}
                            className="dev-code-char"
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
            </div>
            
            {/* Links */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:mt-6 sm:gap-6 sm:text-sm">
              <a href="#" className="text-foreground hover:underline underline-offset-4">
                Read the docs
              </a>
              <span className="text-foreground/20">|</span>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
