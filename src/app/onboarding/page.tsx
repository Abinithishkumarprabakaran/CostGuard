"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Server, CheckCircle2 } from "lucide-react"

export default function OnboardingPage() {
  const [roleArn, setRoleArn] = useState("")
  const [awsAccountId, setAwsAccountId] = useState("")
  const [accountAlias, setAccountAlias] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleConnect = async () => {
    if (!roleArn || !awsAccountId) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleArn, awsAccountId, accountAlias, externalId: "mock-external-id-123" })
      })
      if (res.ok) {
        router.push("/dashboard")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to connect account")
      }
    } catch (e: any) {
      alert("Error connecting: " + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Connect your first AWS Account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cost Guard needs read-only access to your AWS billing data to provide insights and alerts.
          </p>
        </div>

        <Card className="border-primary shadow-md">
          <CardContent className="pt-6 grid gap-8">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold mb-1">Create IAM Role</h4>
                  <p className="text-sm text-muted-foreground mb-3">Log into your AWS Console and create a new IAM role with the Cost Explorer ReadOnly policy. Include a trust relationship for Cost Guard.</p>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://console.aws.amazon.com/iam/', '_blank')}>
                    Open AWS IAM Console <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <div className="w-full space-y-3">
                  <h4 className="font-semibold mb-1">Provide Account Details</h4>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Account Alias (Optional)</label>
                    <input 
                      type="text" 
                      value={accountAlias}
                      onChange={(e) => setAccountAlias(e.target.value)}
                      placeholder="e.g. Production Main" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">AWS Account ID</label>
                    <input 
                      type="text" 
                      value={awsAccountId}
                      onChange={(e) => setAwsAccountId(e.target.value)}
                      placeholder="123456789012" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Role ARN</label>
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
            </div>
            
            <div className="bg-muted/50 rounded-lg p-6 border flex flex-col justify-center items-center text-center space-y-4">
              <Server className="h-12 w-12 text-muted-foreground opacity-50" />
              <div>
                <h4 className="font-semibold">Ready to connect</h4>
                <p className="text-sm text-muted-foreground mt-1">We will verify the connection and begin syncing your historical cost data immediately.</p>
              </div>
              <Button 
                onClick={handleConnect} 
                disabled={isSubmitting || !roleArn || !awsAccountId} 
                className="w-full mt-2" 
                size="lg"
              >
                {isSubmitting ? "Connecting..." : "Verify & Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
