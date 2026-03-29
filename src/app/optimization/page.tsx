"use client"

import { useState, useEffect } from "react"
import { Cpu, Database, HardDrive, Network, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function OptimizationPage() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/optimization')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch optimizations");
        return res.json();
      })
      .then(data => {
        setRecommendations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load optimizations", err)
        setRecommendations([])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading optimizations...</div>

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
              {group.items?.map((item: any, i: number) => (
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
