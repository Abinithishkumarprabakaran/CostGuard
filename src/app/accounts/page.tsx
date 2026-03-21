"use client"

import { Plus, CheckCircle2, AlertCircle, Clock, Server, Trash2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const accounts = [
  {
    name: "Production (Main)",
    id: "847291038475",
    status: "Healthy",
    lastSync: "10 mins ago",
    spend: "$9,450.00",
    resources: 432
  },
  {
    name: "Development Sandbox",
    id: "119028374655",
    status: "Warning",
    lastSync: "12 mins ago",
    spend: "$1,820.00",
    resources: 184
  },
  {
    name: "Marketing & Data",
    id: "334190283746",
    status: "Healthy",
    lastSync: "15 mins ago",
    spend: "$1,180.00",
    resources: 56
  }
]

export default function AccountsPage() {
  const [showConnect, setShowConnect] = useState(false)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Connected AWS Accounts</h2>
          <p className="text-muted-foreground">
            Manage your cloud environments and IAM role integrations.
          </p>
        </div>
        <Button onClick={() => setShowConnect(true)}>
          <Plus className="mr-2 h-4 w-4" /> Connect New Account
        </Button>
      </div>

      {showConnect && (
        <Card className="border-primary shadow-md mb-8 animate-in slide-in-from-top-4">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Connect AWS Account</CardTitle>
                <CardDescription>Follow these steps to grant read-only access to your billing data.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowConnect(false)}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold mb-1">Create IAM Role</h4>
                  <p className="text-sm text-muted-foreground mb-3">Log into your AWS Console and create a new IAM role with the `cost-alert-read-only` policy.</p>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Open AWS Console <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <div className="w-full">
                  <h4 className="font-semibold mb-1">Paste Role ARN</h4>
                  <p className="text-sm text-muted-foreground mb-3">Enter the ARN of the role you just created.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="arn:aws:iam::123456789012:role/CostAlertMonitoring" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Button className="w-full mt-2" size="lg">Verify & Connect</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <Card key={acc.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={acc.status === 'Healthy' ? 'success' : 'warning'} className="mb-2">
                  {acc.status === 'Healthy' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                  {acc.status}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center font-medium bg-secondary px-2 py-1 rounded-full">
                  <Clock className="mr-1 h-3 w-3" /> {acc.lastSync}
                </span>
              </div>
              <CardTitle className="text-xl">{acc.name}</CardTitle>
              <CardDescription className="font-mono text-xs">{acc.id}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2 flex-grow space-y-4">
              <div className="flex justify-between items-end border-b pb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Month Spend</p>
                  <p className="text-2xl font-bold">{acc.spend}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tracked Resources:</span>
                <span className="font-medium">{acc.resources}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4 border-t flex justify-between">
              <Button variant="outline" size="sm">Manage Access</Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ExternalLink({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  )
}
