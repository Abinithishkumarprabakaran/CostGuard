"use client"

import { Plus, CheckCircle2, AlertCircle, Clock, Server, Trash2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => {
        // Map to UI shape
        const mapped = Array.isArray(data) ? data.map((a: any) => ({
          name: a.account_alias || a.aws_account_id,
          id: a.aws_account_id,
          internalId: a.id,
          status: a.status === 'active' ? 'Healthy' : 'Warning',
          lastSync: a.connected_at ? new Date(a.connected_at).toLocaleDateString() : 'N/A',
          spend: "N/A", // From another API route usually
          resources: "N/A" // From another API route usually
        })) : [];
        setAccounts(mapped)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load accounts", err)
        setLoading(false)
      })
  }, [])

  const handleDisconnect = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setAccounts(accs => accs.filter(a => a.internalId !== id))
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading accounts...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Connected AWS Accounts</h2>
          <p className="text-muted-foreground">
            Manage your cloud environments and IAM role integrations.
          </p>
        </div>
        <Button onClick={() => router.push('/onboarding')}>
          <Plus className="mr-2 h-4 w-4" /> Connect New Account
        </Button>
      </div>

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
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDisconnect(acc.internalId)}>
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
