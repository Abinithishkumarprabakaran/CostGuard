"use client"

import { useState, useEffect } from "react"
import { Download, Calendar, ArrowUpRight, BarChart4 } from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    fetch('/api/reports')
     .then(res => res.json())
     .then(setData)
  }, [])

  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading reports...</div>

  const { monthlyData = [], forecastCurrentMonth = 0, budgetCurrentMonth = 0, keyTakeaways = [] } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Executive Reports</h2>
          <p className="text-muted-foreground">
            Generate and schedule comprehensive cost summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Schedule Weekly
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>6-Month Spend vs Budget</CardTitle>
            <CardDescription>Historical trend of total AWS costs against allocated budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{fill: '#F6F7FB'}}
                    formatter={(val: any) => [`$${val}`, "Cost"]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E6E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="cost" name="Actual Cost" fill="#5B6CFF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget" fill="#E6E8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Key Takeaways</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-destructive/10 p-2 rounded-full mt-0.5">
                  <ArrowUpRight className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <div className="font-semibold">Compute costs rose 14%</div>
                  <div className="text-muted-foreground mt-0.5">Driven by new auto-scaling policies in the us-east-1 region.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-success/10 p-2 rounded-full mt-0.5">
                  <BarChart4 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="font-semibold">$1,200 savings realized</div>
                  <div className="text-muted-foreground mt-0.5">From deleting unattached EBS volumes last week.</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t mt-4">
              <p className="text-xs text-muted-foreground">Generated on Feb 27, 2026</p>
            </CardFooter>
          </Card>
          
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-primary-foreground text-lg">Forecast: March</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">$15,400</div>
              <p className="text-sm opacity-90">
                Based on current run rates, you will exceed your March budget of $14,000 by 10%.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full font-semibold">View Optimization Plan</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
