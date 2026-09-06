"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "For individuals and small projects",
    price: { monthly: 0, annual: 0 },
    features: [
      "Up to 3 projects",
      "1GB storage",
      "Community support",
      "Basic analytics",
      "SSL certificates",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing teams and businesses",
    price: { monthly: 29, annual: 24 },
    features: [
      "Unlimited projects",
      "100GB storage",
      "Priority support",
      "Advanced analytics",
      "Custom domains",
      "Team collaboration",
      "API access",
    ],
    cta: "Start trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    price: { monthly: null, annual: null },
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
      "Security audit",
      "Custom contracts",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative border-t border-foreground/10 py-16 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12 max-w-3xl sm:mb-16 lg:mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Pricing
          </span>
          <h2 className="mb-5 font-display text-4xl tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Simple, transparent
            <br />
            <span className="text-stroke">pricing</span>
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-lg">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-10 flex flex-wrap items-center gap-3 sm:mb-16 sm:gap-4">
          <span
            className={`text-sm transition-colors ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 bg-foreground/10 rounded-full p-1 transition-colors hover:bg-foreground/20"
          >
            <div
              className={`w-5 h-5 bg-foreground rounded-full transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm transition-colors ${
              isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Annual
          </span>
          {isAnnual && (
            <span className="ml-2 px-2 py-1 bg-foreground text-primary-foreground text-xs font-mono">
              Save 17%
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative p-5 sm:p-7 lg:p-12 bg-background ${
                plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              {/* Plan Header */}
              <div className="mb-6 sm:mb-8">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 border-b border-foreground/10 pb-6 sm:mb-8 sm:pb-8">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl text-foreground sm:text-5xl lg:text-6xl">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                ) : (
                  <span className="font-display text-4xl text-foreground">Custom</span>
                )}
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3 sm:mb-10 sm:space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`flex min-h-10 w-full items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all group sm:py-4 sm:text-sm ${
                  plan.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          All plans include automatic updates, HTTPS, and DDoS protection.{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Compare all features
          </a>
        </p>
      </div>
    </section>
  );
}
