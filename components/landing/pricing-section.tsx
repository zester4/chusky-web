import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import styles from "./product-page.module.css";

const plans = [
  {
    name: "Hobby",
    price: 79,
    limits: [
      ["Users", "1"],
      ["Active missions", "2"],
      ["Agent actions", "2,500"],
      ["Meeting hours", "1"],
      ["Voice minutes", "30"],
      ["Phone numbers", "1"],
    ],
  },
  {
    name: "Starter",
    price: 199,
    limits: [
      ["Users", "1"],
      ["Active missions", "5"],
      ["Agent actions", "10,000"],
      ["Meeting hours", "3"],
      ["Voice minutes", "100"],
      ["Phone numbers", "1"],
    ],
  },
  {
    name: "Business",
    price: 449,
    recommended: true,
    limits: [
      ["Users", "5"],
      ["Active missions", "50"],
      ["Agent actions", "50,000"],
      ["Meeting hours", "10"],
      ["Voice minutes", "300"],
      ["Phone numbers", "3"],
    ],
  },
  {
    name: "Growth",
    price: 899,
    limits: [
      ["Users", "15"],
      ["Active missions", "200"],
      ["Agent actions", "200,000"],
      ["Meeting hours", "30"],
      ["Voice minutes", "1,000"],
      ["Phone numbers", "10"],
    ],
  },
] as const;

export function PricingSection() {
  return (
    <section id="pricing" aria-label="Monthly plans">
      <div className={styles.pricingGrid}>
        {plans.map((plan) => {
          const recommended = "recommended" in plan && plan.recommended;
          return (
            <article
              className={`${styles.pricingPlan}${recommended ? ` ${styles.recommendedPlan}` : ""}`}
              key={plan.name}
            >
              <div className={styles.pricingPlanHeader}>
                <div>
                  <h2>{plan.name}</h2>
                  <p className={styles.pricingPrice}>
                    <span>${plan.price}</span> / month
                  </p>
                </div>
                {recommended && <span className={styles.recommendedBadge}>Recommended</span>}
              </div>
              <ul className={styles.pricingLimits}>
                {plan.limits.map(([label, value]) => (
                  <li key={label}>
                    <Check size={15} aria-hidden="true" />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={styles.pricingAction}
                aria-label={`Get started with the ${plan.name} plan`}
              >
                Get started <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
