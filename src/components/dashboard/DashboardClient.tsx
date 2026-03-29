"use client"

import { useState, useEffect } from "react"
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  PiggyBank,
  Zap
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [opts, setOpts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard')
        .then(r => {
          if (!r.ok) throw new Error("Dashboard fetch failed");
          return r.json();
        })
        .catch(() => ({})),
      fetch('/api/optimization')
        .then(r => {
          if (!r.ok) throw new Error("Optimization fetch failed");
          return r.json();
        })
        .catch(() => ([]))
    ]).then(([dash, opt]) => {
      setData(dash || {});
      setOpts(opt || []);
    }).catch(err => {
      // Prevent unhandled promise rejection
      console.error(err);
      setData({});
      setOpts([]);
    });
  }, []);

  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  const costOverTimeData = Array.isArray(data?.costOverTime) ? data.costOverTime : [];
  const spendByServiceData = Array.isArray(data?.spendByService) ? data.spendByService : [];
  const topCostDrivers = Array.isArray(data?.topCostDrivers) ? data.topCostDrivers : [];
  const activeAnomalies = Array.isArray(data?.recentAnomalies) ? data.recentAnomalies : [];
  
  // Safely handle API error objects and flatten the categorized items
  const optimizationOpportunities = Array.isArray(opts) 
    ? opts.flatMap((cat: any) => cat.items || []) 
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Executive Summary</h2>
        <p className="text-muted-foreground">
          Your cloud cost posture at a glance.
        </p>
      </div>

      {/* Metric Cards Top Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.currentMonthSpend?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="mr-1 h-3 w-3 text-destructive" />
              <span className="text-destructive font-medium">+{data.percentChange}%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecasted Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.forecastedSpend?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
               <span className="text-muted-foreground">Projected EOM total</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Change vs Last Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">+{data.percentChange}%</div>
            <p className="text-xs text-muted-foreground mt-1">
               <span className="text-muted-foreground">Higher than average</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Active Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.activeAnomalies}</div>
            <p className="text-xs text-destructive mt-1 flex items-center font-medium">
               Immediate action advised
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/50 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-success">Potential Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${data.potentialSavings}/mo</div>
            <p className="text-xs text-success mt-1 flex items-center font-medium">
               {optimizationOpportunities.length} optimization targets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Cost Over Time (Last 30 Days)</CardTitle>
            <CardDescription>Daily spend showing anomalous spikes</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costOverTimeData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6B7280' }} 
                    dy={10}
                    minTickGap={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(val) => `$${val}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E6E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`$${value}`, "Cost"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#5B6CFF" 
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.anomaly) {
                        return (
                          <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} key={`dot-${payload.date}`} />
                        );
                      }
                      return <circle cx={cx} cy={cy} r={0} key={`dot-${payload.date}`} />;
                    }}
                    activeDot={{ r: 6, fill: "#5B6CFF", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Spend by Service</CardTitle>
            <CardDescription>Current month allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendByServiceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {spendByServiceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Spend"]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E6E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value: any, entry: any, index: number) => (
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Cost Drivers Today</CardTitle>
            <CardDescription>Highest spending services in the last 24h</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>% Total</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCostDrivers.map((driver: any) => (
                  <TableRow key={driver.service}>
                    <TableCell className="font-medium">{driver.service}</TableCell>
                    <TableCell>{driver.cost}</TableCell>
                    <TableCell>{driver.percent}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "flex items-center text-xs font-medium",
                        driver.trend.startsWith('+') ? "text-destructive" : "text-success"
                      )}>
                        {driver.trend.startsWith('+') ? 
                          <ArrowUpRight className="mr-1 h-3 w-3" /> : 
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        }
                        {driver.trend}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> 
              Detected Anomalies
            </CardTitle>
            <CardDescription>Immediate action recommended</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAnomalies.map((anomaly: any, i: number) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{anomaly.service} • {anomaly.account}</div>
                      <div className="text-sm text-destructive font-medium mt-1">Cost Spike: {anomaly.increase}</div>
                    </div>
                    <Badge variant={anomaly.severity === 'Critical' ? 'destructive' : 'warning'}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">Likely Cause:</span> {anomaly.cause}
                  </div>
                  <div className="mt-2 text-right">
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row 2 */}
      <div>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Zap className="mr-2 h-5 w-5" /> 
              Optimization Opportunities
            </CardTitle>
            <CardDescription>Actionable recommendations to reduce your monthly cloud bill</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {optimizationOpportunities.map((opt: any, i: number) => (
                <div key={i} className="flex flex-col rounded-lg border bg-card p-4 shadow-sm">
                  <div className="font-semibold">{opt.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 mb-4 flex-1">{opt.description}</div>
                  
                  <div className="mt-auto pt-4 border-t flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Est. Savings:</span>
                      <span className="font-bold text-success">{opt.savings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Effort:</span>
                      <span>{opt.effort}</span>
                    </div>
                    <Button size="sm" className="w-full mt-2">Apply Fix</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
