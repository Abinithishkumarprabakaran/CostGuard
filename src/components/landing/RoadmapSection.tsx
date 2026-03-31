"use client"

import { useState } from "react"
import { Check, Clock, Rocket, ArrowRight } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type BadgeVariant = "live" | "soon" | "planned" | "horizon"

interface Phase {
  number: string
  title: string
  badge: BadgeVariant
  badgeLabel: string
  quarter?: string
  features: string[]
}

// ── Data ───────────────────────────────────────────────────────────────────

const phases: Phase[] = [
  {
    number: "01",
    title: "AWS Cost Intelligence",
    badge: "live",
    badgeLabel: "Live Now",
    features: [
      "AWS cost spike detection",
      "AI-powered cost explanations (Claude Haiku)",
      "Slack + email alerts",
      "EC2, RDS, S3, Lambda coverage",
      "Cost Explorer + Budgets API integration",
    ],
  },
  {
    number: "02",
    title: "Kubernetes Layer",
    badge: "soon",
    badgeLabel: "Coming Soon",
    quarter: "Q3 2026",
    features: [
      "Kubernetes cost layer (EKS support)",
      "Per-namespace spend breakdown",
      "Idle pod + over-provisioned node alerts",
      "Works inside your existing AWS bill — no new cloud account needed",
    ],
  },
  {
    number: "03",
    title: "Multi-Cloud Expansion",
    badge: "planned",
    badgeLabel: "Planned",
    quarter: "Q4 2026",
    features: [
      "Microsoft Azure support (Cost Management API)",
      "Google Cloud Platform support (BigQuery billing export)",
      "AKS + GKE Kubernetes support",
      "Cross-cloud alert normalization",
    ],
  },
  {
    number: "04",
    title: "Unified Cloud Control",
    badge: "horizon",
    badgeLabel: "On the Horizon",
    features: [
      "Unified multi-cloud dashboard (AWS + Azure + GCP)",
      "CoreWeave / GPU cost monitoring",
      "Per-team budget enforcement across clouds",
      "Tag normalization across providers",
    ],
  },
]

// ── Badge styles ────────────────────────────────────────────────────────────

const badgeStyles: Record<BadgeVariant, string> = {
  live:    "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400",
  soon:    "bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400",
  planned: "bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:text-amber-500",
  horizon: "bg-muted text-muted-foreground border border-border",
}

const cardStyles: Record<BadgeVariant, string> = {
  live:    "border-emerald-500/40 bg-card ring-1 ring-emerald-500/20",
  soon:    "border-border bg-card",
  planned: "border-border bg-card",
  horizon: "border-border bg-muted/30",
}

const numberStyles: Record<BadgeVariant, string> = {
  live:    "text-emerald-500/30",
  soon:    "text-amber-500/25",
  planned: "text-amber-500/20",
  horizon: "text-muted-foreground/20",
}

const iconStyles: Record<BadgeVariant, { icon: "check" | "clock"; color: string }> = {
  live:    { icon: "check", color: "text-emerald-500" },
  soon:    { icon: "clock", color: "text-amber-500"   },
  planned: { icon: "clock", color: "text-amber-400"   },
  horizon: { icon: "clock", color: "text-muted-foreground" },
}

// ── Connector dots (desktop timeline) ─────────────────────────────────────

const connectorStyles: Record<BadgeVariant, string> = {
  live:    "bg-emerald-500",
  soon:    "bg-amber-500",
  planned: "bg-amber-400",
  horizon: "bg-muted-foreground/40",
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RoadmapSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    // Simulate async — wire to your email service (Resend) when ready
    await new Promise((r) => setTimeout(r, 800))
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <section id="roadmap" className="w-full py-16 md:py-24 lg:py-32 bg-background border-t">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">

        {/* Section header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground">
            <Rocket className="h-3 w-3" />
            Product Roadmap
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            What&apos;s Live. What&apos;s Coming.
          </h2>
          <p className="max-w-xl text-muted-foreground md:text-lg leading-relaxed">
            AWS cost monitoring is just the start. Here&apos;s where CostGuard is headed —
            built for teams who need full cloud visibility, not just one provider.
          </p>
        </div>

        {/* Desktop timeline connector bar */}
        <div className="hidden lg:flex items-center justify-between mb-6 px-8 relative">
          {/* Connecting line */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-px bg-border" />
          {phases.map((phase) => (
            <div key={phase.number} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`h-3 w-3 rounded-full border-2 border-background ring-2 ring-offset-0 ${connectorStyles[phase.badge]} ring-${connectorStyles[phase.badge]}`} />
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {phase.quarter ?? (phase.badge === "live" ? "Available" : "TBD")}
              </span>
            </div>
          ))}
        </div>

        {/* Phase cards — horizontal on desktop, vertical on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {phases.map((phase) => {
            const { icon, color } = iconStyles[phase.badge]
            const FeatureIcon = icon === "check" ? Check : Clock

            return (
              <div
                key={phase.number}
                className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md ${cardStyles[phase.badge]}`}
              >
                {/* Phase number watermark */}
                <span className={`absolute top-4 right-5 text-5xl font-black select-none pointer-events-none ${numberStyles[phase.badge]}`}>
                  {phase.number}
                </span>

                {/* Badge */}
                <span className={`self-start inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold mb-4 ${badgeStyles[phase.badge]}`}>
                  {phase.badge === "live" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {phase.badgeLabel}
                </span>

                {/* Title */}
                <h3 className="text-base font-bold text-foreground mb-4 pr-8">
                  {phase.title}
                </h3>

                {/* Features */}
                <ul className="space-y-2.5 mt-auto">
                  {phase.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FeatureIcon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                      <span className={phase.badge === "horizon" ? "text-muted-foreground" : "text-foreground/80"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Email capture */}
        <div className="mt-16 mx-auto max-w-xl text-center">
          <div className="rounded-2xl border bg-muted/30 p-8 space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Stay in the loop
            </p>
            <h3 className="text-xl font-bold text-foreground">
              Get notified when Azure &amp; GCP support launches
            </h3>
            <p className="text-sm text-muted-foreground">
              No spam. One email when Phase 3 ships. Unsubscribe anytime.
            </p>

            {submitted ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <Check className="h-4 w-4" />
                You&apos;re on the list — we&apos;ll let you know!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
                >
                  {submitting ? "Saving..." : (
                    <>Notify me <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
