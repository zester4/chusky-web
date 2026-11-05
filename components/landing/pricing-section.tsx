import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentCard, ContentSection } from "./content-page";
import styles from "./product-page.module.css";

export function PricingSection() {
  return <>
    <section id="pricing"><div className={styles.accessPanel}>
      <div><p className={styles.eyebrow}>Your workspace, at a glance</p><h2 className="mt-5">See the access<br />behind your account.</h2><p>Chusky does not currently publish public plan prices or limits. Your signed-in workspace is the source for current usage and enabled capabilities.</p><Link href="/docs" className={styles.secondaryAction}>Read the product docs <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <div className={styles.accessBox}><p className={styles.eyebrow}>Account access</p><h3>Know what you can use.</h3><dl><div><dt>Usage</dt><dd>Available in your workspace</dd></div><div><dt>Connected apps</dt><dd>Accounts you authorize</dd></div><div><dt>Additional capabilities</dt><dd>Based on provider setup</dd></div><div><dt>Public pricing</dt><dd>Not currently published</dd></div></dl><Link href="/sign-in" className={styles.primaryAction}>View my workspace <ArrowUpRight size={18} aria-hidden="true" /></Link><p>New to Chusky? <Link href="/sign-up" className="underline underline-offset-4">Create an account.</Link></p></div>
    </div></section>
    <ContentSection eyebrow="Before you get started" title="A little clarity goes a long way."><p className="mb-8 max-w-2xl text-sm leading-6 text-muted-foreground">Availability depends on the connected accounts, provider setup, workspace permissions, and capabilities enabled for your deployment.</p><div className="grid sm:grid-cols-2"><ContentCard title="What affects availability?">Connected accounts, provider setup, workspace permissions, and the capabilities enabled for your deployment determine what you can use.</ContentCard><ContentCard title="Where do I check my usage?">Sign in to your workspace to inspect current usage and account access. This public page does not read or estimate your private account data.</ContentCard></div></ContentSection>
    <ContentSection eyebrow="Choose the first job" title="Start with a piece of your day." description="You can begin with one workflow, then bring in more channels and tools as you need them. Your workspace shows which capabilities are ready and which need a connection."><div className={styles.featureList}>{[
      ["Conversations", "The meeting and its next step.", "Join a supported meeting, capture the agreement, and prepare the follow-up. Connect business voice for incoming and outgoing calls."],
      ["Your routine", "The inbox and the calendar.", "Set up Elena’s scheduled check-ins, add a reminder, or let a relevant event start the next task."],
      ["A bigger goal", "The project that takes a while.", "Set the steps, budget, and finish line for a mission. Keep progress and evidence alongside the result."],
    ].map(([label, title, description]) => <article className={styles.featureRow} key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}</div><Link href="/features" className={styles.secondaryAction}>Explore the capabilities <ArrowUpRight size={16} aria-hidden="true" /></Link></ContentSection>
  </>;
}
