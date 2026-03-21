"use client"

import { Cpu, Database, HardDrive, Network, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const recommendations = [
  {
    category: "Compute",
    icon: Cpu,
    items: [
      {
        title: "Terminate idle EC2 instances",
        resource: "i-0a1b2c3d4e5f6g7h8 (us-west-2)",
        savings: "$134.50",
        effort: "Low",
        risk: "Low",
      },
      {
        title: "Right-size underutilized instances",
        resource: "worker-pool-asg",
        savings: "$420.00",
        effort: "Medium",
        risk: "High",
      }
    ]
  },
  {
    category: "Storage",
    icon: HardDrive,
    items: [
      {
        title: "Delete unattached EBS volumes",
        resource: "8 orphaned volumes found",
        savings: "$98.20",
        effort: "Low",
        risk: "Low",
      },
      {
        title: "Move old S3 data to Infrequent Access",
        resource: "logs-bucket-prod",
        savings: "$210.00",
        effort: "Medium",
        risk: "Low",
      }
    ]
  },
  {
    category: "Database",
    icon: Database,
    items: [
      {
        title: "Stop idle non-production RDS",
        resource: "staging-db-cluster",
        savings: "$350.00",
        effort: "Low",
        risk: "Medium",
      }
    ]
  },
  {
    category: "Networking",
    icon: Network,
    items: [
      {
        title: "Delete unused NAT Gateways",
        resource: "nat-09f8e7d6c5b4a3 (eu-central-1)",
        savings: "$68.00",
        effort: "Low",
        risk: "Low",
      }
    ]
  }
]

export default function OptimizationPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cost Optimization</h2>
        <p className="text-muted-foreground">
          Actionable recommendations to reduce waste and optimize architecture.
        </p>
      </div>

      <div className="grid gap-6">
        {recommendations.map((group) => (
          <div key={group.category} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <group.icon className="h-5 w-5 text-primary" />
              {group.category}
            </h3>
            
            <div className="grid gap-4">
              {group.items.map((item, i) => (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base">{item.title}</h4>
                      <p className="text-sm text-muted-foreground font-mono bg-muted inline-block px-2 py-0.5 rounded">
                        {item.resource}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Savings/mo</span>
                        <span className="font-bold text-success text-base">{item.savings}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Effort</span>
                        <Badge variant="outline" className="w-fit">{item.effort}</Badge>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Risk</span>
                        <Badge variant={item.risk === 'High' ? 'destructive' : item.risk === 'Medium' ? 'warning' : 'outline'} className="w-fit">
                          {item.risk}
                        </Badge>
                      </div>

                      <Button className="ml-2 w-full sm:w-auto">
                        Apply Fix <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
