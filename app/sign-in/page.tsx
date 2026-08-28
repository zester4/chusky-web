import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/landing/auth-form";
import { ProductPageShell } from "@/components/landing/product-page";

export const metadata: Metadata = {
  title: "Sign in | Chusky AI Agent",
  description: "Sign in to continue working with Chusky across Telegram, your connected apps, and linked terminal.",
};

export default function SignInPage() {
  return (
    <ProductPageShell>
      <section className="relative pt-40 pb-24 lg:pt-48 lg:pb-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_440px] gap-16 lg:gap-24 items-center">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
                <span className="w-8 h-px bg-foreground/30" />
                Welcome back
              </span>
              <h1 className="text-6xl md:text-8xl font-display leading-[0.9] tracking-tight mb-8">
                Continue with<br /><span className="text-muted-foreground">Chusky.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Pick up where you left off. Your connected apps, private scratchpad, and persistent workspace are waiting.
              </p>
            </div>
            <div>
              <SignInForm />
              <p className="text-center text-sm text-muted-foreground mt-6">
                New to Chusky?{" "}
                <Link href="/start-creating" className="text-foreground underline underline-offset-4">Start creating</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </ProductPageShell>
  );
}
