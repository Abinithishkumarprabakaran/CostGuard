"use client"

import { useState } from "react"
import { Check, Copy, Eye, EyeOff, Save, Shield, Bell, Users, Settings as SettingsIcon, Plus } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrganizationProfile } from "@clerk/nextjs"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
        <p className="text-muted-foreground">
          Manage your account, team members, and integration preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <aside className="w-full md:w-64 flex shrink-0 border-r md:h-[calc(100vh-12rem)] overflow-y-auto pr-6">
          <nav className="flex md:flex-col gap-1 w-full overflow-x-auto pb-4 md:pb-0">
            {[
              { id: "general", label: "General", icon: SettingsIcon },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "security", label: "Security & API", icon: Shield },
              { id: "team", label: "Team Management", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-primary" : ""}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6 min-h-[500px]">
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your organization details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <input type="text" defaultValue="Startup Inc." className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option>UTC (Coordinated Universal Time)</option>
                        <option selected>PST (Pacific Standard Time)</option>
                        <option>EST (Eastern Standard Time)</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Currency</label>
                      <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option selected>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 bg-muted/20">
                  <Button><Save className="h-4 w-4 mr-2"/> Save Changes</Button>
                </CardFooter>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Permanently delete your organization and all data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">Delete Organization</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Routing</CardTitle>
                  <CardDescription>Configure where anomaly alerts are sent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Slack Integration */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#4A154B] p-2 rounded-md h-10 w-10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1 2.521-2.52A2.528 2.528 0 0 1 13.876 5.042a2.527 2.527 0 0 1-2.521 2.52h-2.521v-2.52zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1-2.523 2.522A2.528 2.528 0 0 1 10.12 18.956a2.527 2.527 0 0 1 2.522-2.52h2.523v2.52zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Slack Workspace</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Alerts sent to #aws-cost-alerts</p>
                      </div>
                    </div>
                    <Badge variant="success" className="bg-success/10 text-success border-success/20">Connected</Badge>
                  </div>

                  {/* Email Settings */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm">Email Digest</h4>
                    
                    <div className="flex items-center shadow-sm justify-between p-3 border rounded-md">
                      <div>
                        <div className="text-sm font-medium">Daily Cost Summary</div>
                        <div className="text-xs text-muted-foreground">Receive a roll-up of yesterday&apos;s spend.</div>
                      </div>
                      <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <span className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform translate-x-[9px]" />
                      </div>
                    </div>
                    
                    <div className="flex items-center shadow-sm justify-between p-3 border rounded-md">
                      <div>
                        <div className="text-sm font-medium">Critical Anomaly Alerts</div>
                        <div className="text-xs text-muted-foreground">Immediate email on anomalies {'>'}$100.</div>
                      </div>
                      <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <span className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform translate-x-[9px]" />
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>API Credentials</CardTitle>
                  <CardDescription>Manage keys used for programmatic access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-xl bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Production API Key</span>
                      <Badge variant="outline">Created Jan 12</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted p-2 rounded text-sm font-mono tracking-wider overflow-hidden">
                        {showApiKey ? "sk_live_928374982y4hfsdfa3u84..." : "sk_live_•••••••••••••••••••••••••"}
                      </code>
                      <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Generate New Key</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <OrganizationProfile 
                  appearance={{
                    elements: {
                      rootBox: "w-full focus:outline-none focus:ring-0",
                      card: "w-full max-w-full shadow-sm focus:outline-none focus:ring-0",
                    }
                  }}
                  routing="hash"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
