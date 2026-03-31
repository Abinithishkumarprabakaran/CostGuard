"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Server, Copy, CheckCircle2, Download, AlertCircle } from "lucide-react"

export default function OnboardingPage() {
  const [roleArn, setRoleArn] = useState("")
  const [awsAccountId, setAwsAccountId] = useState("")
  const [accountAlias, setAccountAlias] = useState("")
  const [externalId, setExternalId] = useState("")
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Generate a unique External ID for this user on mount
  useEffect(() => {
    fetch("/api/accounts/generate-external-id")
      .then((res) => res.json())
      .then((data) => {
        if (data.externalId) setExternalId(data.externalId)
      })
      .catch(() => {
        // Fallback: generate client-side UUID
        setExternalId(crypto.randomUUID())
      })
  }, [])

  const copyExternalId = () => {
    navigator.clipboard.writeText(externalId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConnect = async () => {
    if (!roleArn || !awsAccountId || !externalId) return
    setIsSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleArn, awsAccountId, accountAlias, externalId }),
      })
      if (res.ok) {
        router.push("/dashboard")
      } else {
        const err = await res.json()
        setError(err.error || "Failed to connect account")
      }
    } catch (e: any) {
      setError("Error connecting: " + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const costGuardAccountId = process.env.NEXT_PUBLIC_COST_GUARD_AWS_ACCOUNT_ID

  const trustPolicy = JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: `arn:aws:iam::${costGuardAccountId || "YOUR_COST_GUARD_ACCOUNT_ID"}:root`,
          },
          Action: "sts:AssumeRole",
          Condition: {
            StringEquals: {
              "sts:ExternalId": externalId || "<YOUR_EXTERNAL_ID>",
            },
          },
        },
      ],
    },
    null,
    2
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">Connect your AWS Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cost Guard needs read-only access to your AWS billing data to provide insights and alerts.
          </p>
        </div>

        {!costGuardAccountId && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/40 p-3 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <strong>Missing config:</strong> Set <code className="font-mono bg-yellow-500/20 px-1 rounded">NEXT_PUBLIC_COST_GUARD_AWS_ACCOUNT_ID</code> in your <code className="font-mono bg-yellow-500/20 px-1 rounded">.env.local</code> so customers see the correct AWS Account ID in the trust policy.
            </span>
          </div>
        )}

        <Card className="border-primary shadow-md">
          <CardContent className="pt-6 grid gap-8">

            {/* Step 1 — External ID */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <div className="w-full">
                <h4 className="font-semibold mb-1">Copy Your External ID</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  This unique ID secures the trust relationship between your AWS account and Cost Guard.
                  You will paste it into your IAM role&apos;s trust policy in Step 2.
                </p>
                <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 font-mono text-sm break-all">
                  <span className="flex-1 select-all">{externalId || "Generating..."}</span>
                  <Button variant="ghost" size="sm" onClick={copyExternalId} disabled={!externalId} className="shrink-0">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2 — Create IAM Role */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <div className="w-full space-y-3">
                <h4 className="font-semibold mb-1">Create IAM Role in AWS</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  In your AWS Console, create an IAM role with the <strong>AWSCostExplorerReadOnlyAccess</strong> policy
                  and paste the trust policy below.
                </p>

                {/* Trust policy code block */}
                <div className="relative">
                  <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all border">
                    {trustPolicy}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => { navigator.clipboard.writeText(trustPolicy) }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => window.open("https://console.aws.amazon.com/iam/home#/roles/create", "_blank")}>
                    Open AWS IAM Console <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/cloudformation/cost-guard-iam-role.yaml" download>
                      <Download className="mr-2 h-3 w-3" /> Download CloudFormation Template
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 3 — Enter account details */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <div className="w-full space-y-3">
                <h4 className="font-semibold mb-1">Enter Account Details</h4>

                <div>
                  <label className="text-sm font-medium mb-1 block">Account Alias <span className="text-muted-foreground font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    value={accountAlias}
                    onChange={(e) => setAccountAlias(e.target.value)}
                    placeholder="e.g. Production Main"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">AWS Account ID <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={awsAccountId}
                    onChange={(e) => setAwsAccountId(e.target.value)}
                    placeholder="123456789012"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Role ARN <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={roleArn}
                    onChange={(e) => setRoleArn(e.target.value)}
                    placeholder="arn:aws:iam::123456789012:role/CostGuardRole"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Connect button */}
            <div className="bg-muted/50 rounded-lg p-6 border flex flex-col justify-center items-center text-center space-y-4">
              <Server className="h-12 w-12 text-muted-foreground opacity-50" />
              <div>
                <h4 className="font-semibold">Ready to connect</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  We will verify the connection and begin syncing your historical cost data immediately.
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isSubmitting || !roleArn || !awsAccountId || !externalId}
                className="w-full mt-2"
                size="lg"
              >
                {isSubmitting ? "Verifying & Connecting..." : "Verify & Connect"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
