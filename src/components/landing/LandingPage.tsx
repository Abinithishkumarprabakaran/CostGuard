import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, BellRing, Lock, Search, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { PricingPlans } from "@/components/pricing/PricingPlans"

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center font-bold text-xl gap-2" href="/">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Zap className="h-5 w-5" />
          </div>
          <span>AWS Cost Alert</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">
            How it works
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" className="text-sm font-medium">Log in</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="text-sm font-medium shadow-lg hover:shadow-primary/25 transition-all">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden bg-background">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4 items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  Slack-first Enterprise AWS Cost Monitoring
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Stop AWS bill shock <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#8E9BFF]">before it happens.</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Real-time anomaly detection, intelligent forecasting, and automated cost optimization delivered straight to your Slack channel.
                </p>
              </div>
              <div className="space-x-4 flex flex-col sm:flex-row gap-4 sm:gap-0">
                <Link href="/sign-up">
                  <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full gap-2">
                    Start optimizing today <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full">
                    Explore features
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Mockup visual */}
            <div className="mx-auto mt-16 max-w-5xl rounded-xl border bg-card text-card-foreground shadow-2xl shadow-primary/10 overflow-hidden transform translate-y-4 hover:-translate-y-2 transition-transform duration-500">
               <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                 <div className="h-3 w-3 rounded-full bg-destructive/80" />
                 <div className="h-3 w-3 rounded-full bg-warning/80" />
                 <div className="h-3 w-3 rounded-full bg-success/80" />
                 <div className="ml-4 h-6 w-64 rounded-md bg-background/50 border" />
               </div>
               <div className="p-8 grid gap-8 md:grid-cols-3 bg-card relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                  <div className="col-span-1 border rounded-lg p-6 space-y-4 bg-background/50 backdrop-blur">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-destructive/10 text-destructive rounded-md">
                          <Zap className="h-5 w-5" />
                       </div>
                       <h3 className="font-semibold">Anomaly Detected</h3>
                     </div>
                     <p className="text-2xl font-bold">+245% <span className="text-sm font-normal text-muted-foreground">in EC2 Spend</span></p>
                     <p className="text-sm text-muted-foreground">Detected 2 mins ago in production-us-east-1.</p>
                  </div>
                  <div className="col-span-1 border rounded-lg p-6 space-y-4 hidden md:block bg-background/50 backdrop-blur">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-primary/10 text-primary rounded-md">
                          <BarChart3 className="h-5 w-5" />
                       </div>
                       <h3 className="font-semibold">Forecast</h3>
                     </div>
                     <p className="text-2xl font-bold">$12k <span className="text-sm font-normal text-muted-foreground">projected EOM</span></p>
                     <p className="text-sm text-muted-foreground">Trending 12% above monthly budget.</p>
                  </div>
                  <div className="col-span-1 border rounded-lg p-6 space-y-4 hidden md:block bg-background/50 backdrop-blur">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-success/10 text-success rounded-md">
                          <ShieldCheck className="h-5 w-5" />
                       </div>
                       <h3 className="font-semibold">Automated Action</h3>
                     </div>
                     <p className="text-lg font-medium">Idle DB Paused</p>
                     <p className="text-sm text-success font-medium">Saved $45.00 today</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-[800px]">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Everything you need to control cloud spend</h2>
                <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We don&apos;t just show you charts. We alert you instantly when things go wrong and tell you exactly how to fix them.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <BellRing className="h-6 w-6" />, title: "Instant Slack Alerts", description: "Get notified the minute a cost anomaly occurs. Stop waiting for the end-of-month bill to find expensive mistakes." },
                { icon: <Search className="h-6 w-6" />, title: "Deep Root Cause Analysis", description: "Our AI breaks down exactly what resource is spiking, who deployed it, and why the cost increased." },
                { icon: <BarChart3 className="h-6 w-6" />, title: "Predictive Forecasting", description: "Machine learning models predict your end-of-month spend with 95% accuracy based on historical usage." },
                { icon: <Lock className="h-6 w-6" />, title: "Enterprise RBAC", description: "Granular access controls ensure engineers only see cost data for their specific services and environments." },
                { icon: <ShieldCheck className="h-6 w-6" />, title: "Automated Remediations", description: "One-click actions in Slack to terminate zombie resources, scale down idle instances, and apply savings plans." },
                { icon: <Zap className="h-6 w-6" />, title: "Instant Setup", description: "Connect your AWS account securely in under 2 minutes. No agents to install, no complicated integrations." }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-start p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary mb-4">
                     {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background border-t">
          <div className="container px-4 md:px-6 mx-auto">
            <PricingPlans />
          </div>
        </section>

        {/* ROI Section */}
        <section className="w-full py-16 md:py-24 bg-secondary/30 border-b">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12">Why This Pays for Itself</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-2xl border shadow-sm">
                <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                  <Zap className="h-7 w-7" />
                </div>
                <p className="text-muted-foreground font-medium text-lg">A single misconfigured resource can cost <strong className="text-foreground">$3,000–$10,000</strong>.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-2xl border shadow-sm">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <BellRing className="h-7 w-7" />
                </div>
                <p className="text-muted-foreground font-medium text-lg">AWS Cost Alert identifies spikes <strong className="text-foreground">within 24 hours</strong>.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-2xl border shadow-sm">
                <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-2">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <p className="text-muted-foreground font-medium text-lg">Most customers recover the subscription cost from their <strong className="text-foreground">first prevented issue</strong>.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-8">
              {[
                {
                  q: "Do you store my AWS credentials?",
                  a: "No. We use secure IAM AssumeRole access with temporary credentials. No access keys stored."
                },
                {
                  q: "How long does setup take?",
                  a: "Under 10 minutes. Paste the IAM Role ARN and connect Slack."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Month-to-month billing. No contracts."
                },
                {
                  q: "Do you support multi-account AWS setups?",
                  a: "Yes. Growth supports up to 3 accounts. Pro supports unlimited."
                },
                {
                  q: "What if AWS improves their native alerts?",
                  a: "AWS Cost Alert focuses on plain-English explanations and actionable playbooks delivered directly in Slack."
                }
              ].map((faq, i) => (
                <div key={i} className="border-b border-border pb-6 text-left last:border-0">
                  <h3 className="text-xl font-bold text-foreground mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-20 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">Stop Being Surprised by Your AWS Bill</h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/90 md:text-xl mb-10 font-medium">
              Connect your account in under 10 minutes.
            </p>
            <div className="flex justify-center">
               <Link href="/sign-up">
                 <Button size="lg" className="h-14 px-10 text-lg rounded-full font-bold shadow-xl hover:scale-105 transition-transform text-primary hover:bg-white bg-white">
                   Start Free Trial
                 </Button>
               </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg tracking-tight">AWS Cost Alert</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AWS Cost Alert Inc. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">
              Terms
            </Link>
            <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
