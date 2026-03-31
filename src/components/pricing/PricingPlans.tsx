import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    plan: "starter",
    price: "$49",
    period: "/month",
    label: "For Solo Builders",
    features: [
      "1 AWS account",
      "Daily cost spike detection",
      "Slack alerts with context",
      "Email alerts",
      "30-day cost history",
      "14-day free trial",
      "Cancel anytime"
    ],
    cta: "Start Free Trial"
  },
  {
    name: "Growth",
    plan: "growth",
    price: "$149",
    period: "/month",
    label: "For Seed-Stage Startup Teams",
    features: [
      "Up to 3 AWS accounts",
      "Slack alerts with context",
      "Service-level spike attribution",
      "AI-powered spike explanations",
      "Optimization suggestions",
      "Tag-based cost filtering",
      "Priority email support",
      "14-day free trial"
    ],
    highlighted: true,
    value: "Designed for teams that can't afford surprise cloud bills.",
    cta: "Start Free Trial"
  },
  {
    name: "Pro",
    plan: "pro",
    price: "$299",
    period: "/month",
    label: "For Scaling Teams",
    features: [
      "Unlimited AWS accounts",
      "AI-powered spike explanations",
      "Prescriptive fix playbooks",
      "Custom alert thresholds",
      "Weekly savings summary",
      "90-day cost trend & forecast",
      "Dedicated Slack support channel",
      "14-day free trial"
    ],
    value: "For Series A teams managing multiple AWS accounts.",
    cta: "Start Free Trial"
  }
]

export function PricingPlans() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">Simple, Startup-Friendly Pricing</h2>
        <p className="text-foreground font-medium text-xl max-w-2xl mx-auto">
          One prevented AWS cost spike can pay for a year.
        </p>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          No sales calls. No annual contracts. Live in under 10 minutes.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch mt-8">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200 hover:shadow-md ${
              plan.highlighted ? 'border-primary shadow-primary/20 scale-105 z-10' : 'border-border'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                Most Popular
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm font-medium text-muted-foreground mt-2">{plan.label}</p>
            </div>
            
            <div className="mb-6 flex items-baseline text-foreground">
              <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
              {plan.period && <span className="ml-1 text-muted-foreground font-medium">{plan.period}</span>}
            </div>
            
            <Link href={`/sign-up?plan=${plan.plan}`} className="w-full mb-6">
              <Button
                className="w-full font-bold"
                variant={plan.highlighted ? 'default' : 'outline'}
                size="lg"
              >
                {plan.cta}
              </Button>
            </Link>

            <ul className="space-y-4 shrink-0 flex-1 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm">
                  <CheckCircle2 className="mr-3 h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            {plan.value && (
              <div className="pt-6 mt-auto border-t border-border">
                <p className="text-sm text-muted-foreground italic text-center">
                  &quot;{plan.value}&quot;
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="mt-24 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-4 mb-12">
          <h3 className="text-3xl font-bold tracking-tight text-foreground">See Exactly Where Your Money Goes</h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Basic monitoring is fine for side projects. But when scaling teams manage multiple services, you need context, not just alerts. See why Growth is the standard for funded startups.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-semibold text-foreground w-2/5">Feature</th>
                <th className="p-4 font-semibold text-foreground text-center w-1/5">Starter</th>
                <th className="p-4 font-bold text-primary text-center w-1/5 bg-primary/5">Growth</th>
                <th className="p-4 font-semibold text-foreground text-center w-1/5">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Monitoring */}
              <tr className="bg-muted/30"><td colSpan={4} className="p-3 font-semibold text-foreground text-xs uppercase tracking-wider">Monitoring</td></tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">AWS Accounts Supported</td>
                <td className="p-4 text-center text-muted-foreground">1</td>
                <td className="p-4 text-center text-foreground font-semibold bg-primary/5">Up to 3</td>
                <td className="p-4 text-center text-muted-foreground">Unlimited</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Cost Spike Detection</td>
                <td className="p-4 text-center text-muted-foreground">Daily</td>
                <td className="p-4 text-center text-foreground font-semibold bg-primary/5">Real-time</td>
                <td className="p-4 text-center text-muted-foreground">Real-time</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Cost History</td>
                <td className="p-4 text-center text-muted-foreground">30 days</td>
                <td className="p-4 text-center text-foreground font-semibold bg-primary/5">30 days</td>
                <td className="p-4 text-center text-muted-foreground">90 days</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Cost Trend & Forecast</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-muted-foreground/50 bg-primary/5">✗</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>

              {/* Alerts & Workflow */}
              <tr className="bg-muted/30"><td colSpan={4} className="p-3 font-semibold text-foreground text-xs uppercase tracking-wider">Alerts & Workflow</td></tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Email Alerts</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
                <td className="p-4 text-center text-primary font-bold bg-primary/5">✓</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Slack Alerts</td>
                <td className="p-4 text-center text-foreground font-semibold">✓ <span className="text-xs font-normal text-muted-foreground block">(With context)</span></td>
                <td className="p-4 text-center text-foreground font-semibold bg-primary/5">✓ <span className="text-xs font-normal text-muted-foreground block">(With context)</span></td>
                <td className="p-4 text-center text-foreground font-semibold">✓ <span className="text-xs font-normal text-muted-foreground block">(With context)</span></td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Custom Alert Thresholds</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-muted-foreground/50 bg-primary/5">✗</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Weekly Savings Summary</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-muted-foreground/50 bg-primary/5">✗</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>

              {/* Intelligence & Optimization */}
              <tr className="bg-muted/30"><td colSpan={4} className="p-3 font-semibold text-foreground text-xs uppercase tracking-wider">Intelligence & Optimization</td></tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Service-Level Attribution</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-primary font-bold bg-primary/5">✓</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Optimization Suggestions</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-primary font-bold bg-primary/5">✓</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">AI Spike Explanations</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-primary font-bold bg-primary/5">✓</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Prescriptive Fix Playbooks</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-muted-foreground/50 bg-primary/5">✗</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>

              {/* Control & Customization */}
              <tr className="bg-muted/30"><td colSpan={4} className="p-3 font-semibold text-foreground text-xs uppercase tracking-wider">Control & Customization</td></tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Tag-Based Cost Filtering</td>
                <td className="p-4 text-center text-muted-foreground/50">✗</td>
                <td className="p-4 text-center text-primary font-bold bg-primary/5">✓</td>
                <td className="p-4 text-center text-primary font-bold">✓</td>
              </tr>

              {/* Support */}
              <tr className="bg-muted/30"><td colSpan={4} className="p-3 font-semibold text-foreground text-xs uppercase tracking-wider">Support</td></tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Support Level</td>
                <td className="p-4 text-center text-muted-foreground">Community</td>
                <td className="p-4 text-center text-foreground font-semibold bg-primary/5">Priority Email</td>
                <td className="p-4 text-center text-muted-foreground">Dedicated Slack</td>
              </tr>

              {/* Billing */}
              <tr className="bg-muted/30"><td colSpan={4} className="p-3 font-semibold text-foreground text-xs uppercase tracking-wider">Billing</td></tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-foreground font-medium">Free Trial</td>
                <td className="p-4 text-center text-primary font-bold">14 days</td>
                <td className="p-4 text-center text-primary font-bold bg-primary/5">14 days</td>
                <td className="p-4 text-center text-primary font-bold">14 days</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Nudge Copy */}
        <div className="mt-12 space-y-8 max-w-3xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h4 className="font-bold text-lg text-foreground mb-2">Why 85% of startups choose Growth:</h4>
            <p className="text-muted-foreground leading-relaxed">
              When a $5,000 RDS anomaly hits, an email alert isn&apos;t enough. Growth drops the exact service, the context, and the fix directly into your engineering Slack channel—saving hours of digging through the AWS console.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h4 className="font-bold text-lg text-foreground mb-2">Managing production, staging, and dev accounts?</h4>
            <p className="text-muted-foreground leading-relaxed">
              Upgrade to Pro for unlimited account coverage, custom alert thresholds, and AI-driven playbooks that tell your team exactly how to fix misconfigurations before they impact your runway.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

