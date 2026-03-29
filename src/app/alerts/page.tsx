"use client"

import { useState, useEffect } from "react"
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AlertsPage() {
  const [historicalAlerts, setHistoricalAlerts] = useState<any[]>([])
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/alerts")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch alerts");
        return res.json();
      })
      .then(data => {
        setHistoricalAlerts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load alerts", err)
        setHistoricalAlerts([])
        setLoading(false)
      })
  }, [])

  const resolveAlert = async (id: string) => {
    await fetch(`/api/alerts/${id}/resolve`, { method: "PATCH" })
    setHistoricalAlerts(alerts => alerts.map(a => a.id === id ? { ...a, resolved: true } : a))
    if (selectedAlert?.id === id) {
      setSelectedAlert({ ...selectedAlert, resolved: true })
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading alerts...</div>

  return (
    <div className="flex h-full relative">
      <div className={`flex-1 transition-all duration-300 ${selectedAlert ? 'pr-[400px]' : ''}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Active & Historical Alerts</h2>
          <p className="text-muted-foreground">
            Review cost anomalies detected across your organization.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Alert Log</CardTitle>
            <CardDescription>Click any row to view root cause analysis and mitigation steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>AWS Account</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Cost Impact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalAlerts.map((alert) => (
                  <TableRow 
                    key={alert.id} 
                    className="cursor-pointer hover:bg-muted/50 data-[state=selected]:bg-muted"
                    data-state={selectedAlert?.id === alert.id ? "selected" : undefined}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <TableCell className="font-medium">{alert.timestamp}</TableCell>
                    <TableCell>{alert.account}</TableCell>
                    <TableCell>{alert.service}</TableCell>
                    <TableCell>
                      <Badge variant={alert.severity === 'Critical' ? 'destructive' : 'warning'}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-destructive font-medium">{alert.impact}</TableCell>
                    <TableCell>
                      {alert.status === 'Open' ? (
                        <Badge variant="outline" className="text-foreground bg-background">Open</Badge>
                      ) : (
                        <Badge variant="success" className="bg-success/10 text-success border-success/20">Resolved</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Drawer Overlay/Sidebar */}
      {selectedAlert && (
        <div className="fixed top-0 right-0 h-full w-[400px] border-l bg-card shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between border-b p-6">
            <h3 className="font-semibold text-lg">{selectedAlert.id} Details</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAlert(null)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{selectedAlert.timestamp}</span>
                <Badge variant={selectedAlert.severity === 'Critical' ? 'destructive' : 'warning'}>
                  {selectedAlert.severity}
                </Badge>
              </div>
              <h4 className="text-xl font-bold mb-1">{selectedAlert.service} Cost Spike</h4>
              <p className="text-sm text-foreground/80">{selectedAlert.account}</p>
            </div>

            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Expected</div>
                  <div className="text-lg font-semibold">$145.00</div>
                </div>
                <ArrowRight className="text-muted-foreground h-5 w-5" />
                <div>
                  <div className="text-sm font-medium text-destructive mb-1">Actual</div>
                  <div className="text-lg font-bold text-destructive">{selectedAlert.impact.split(' ')[0]}</div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h5 className="font-semibold flex items-center mb-3">
                <AlertCircle className="h-4 w-4 mr-2 text-primary" /> Root Cause Analysis
              </h5>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                Automated diagnostics indicate: {selectedAlert.explanation}. The cost slope changed dramatically at {selectedAlert.timestamp.split(' ')[1]} UTC.
              </p>
            </div>

            <div>
              <h5 className="font-semibold flex items-center mb-3">
                <CheckCircle2 className="h-4 w-4 mr-2 text-success" /> Recommended Fix
              </h5>
              <div className="text-sm space-y-3 bg-card border rounded-lg p-4">
                <p>{selectedAlert.action}</p>
                <div className="flex gap-2 pt-2 mt-2 border-t">
                  <Button size="sm" className="w-full">Auto-Remediate</Button>
                  <Button size="sm" variant="outline" className="w-full">Create Jira Issue</Button>
                </div>
              </div>
            </div>

            {selectedAlert.status === 'Open' && (
              <div className="pt-4 border-t">
                <Button variant="secondary" className="w-full text-success hover:text-success hover:bg-success/10 font-semibold border-success/20">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Resolved
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
