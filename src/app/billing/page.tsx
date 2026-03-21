"use client"

import { CheckCircle2, CreditCard, Download, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const invoices = [
  { id: "INV-2026-02", date: "Feb 01, 2026", amount: "$299.00", status: "Paid" },
  { id: "INV-2026-01", date: "Jan 01, 2026", amount: "$299.00", status: "Paid" },
  { id: "INV-2025-12", date: "Dec 01, 2025", amount: "$299.00", status: "Paid" },
]

export default function BillingPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your plan, payment methods, and billing history.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="md:col-span-2 border-primary/20 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  Growth Plan <Badge variant="default" className="ml-3 bg-primary text-primary-foreground">Active</Badge>
                </CardTitle>
                <CardDescription className="mt-1">Perfect for scaling startups with multiple AWS environments.</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">$299<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Tracked AWS Spend: $14,200 / $50,000</span>
                <span className="text-muted-foreground">28%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[28%] rounded-full"></div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-foreground/80">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Up to $50k monthly tracked spend
                </div>
                <div className="flex items-center text-foreground/80">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Unlimited AWS Accounts
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-foreground/80">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Slack & Email Alerts
                </div>
                <div className="flex items-center text-foreground/80">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> 1-Year Data Retention
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 pt-4 border-t flex justify-between sm:justify-start gap-4">
            <Button>Upgrade to Pro</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </CardFooter>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
            <CardDescription>Your next charge is on Mar 01, 2026.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
              <div className="bg-primary/10 p-2 rounded-md">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/28</p>
              </div>
            </div>
            
            <div className="text-sm">
              <span className="text-muted-foreground block mb-1">Billing Contact:</span>
              <span className="font-medium">billing@startup.io</span>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button variant="outline" className="w-full">Update Payment Method</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>View and download past invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant="success" className="bg-success/10 text-success border-success/20">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="ghost" size="sm" className="sm:hidden">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
