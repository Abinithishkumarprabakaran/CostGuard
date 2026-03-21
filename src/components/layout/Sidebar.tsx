"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { hasMinimumRole, type OrganizationRole } from "@/lib/roles"
import { 
  LayoutDashboard, 
  BellRing, 
  BarChart3, 
  Zap, 
  CloudCog, 
  CreditCard, 
  Settings,
  HelpCircle
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, role: "org:viewer" },
  { name: "Alerts", href: "/alerts", icon: BellRing, role: "org:viewer" },
  { name: "Reports", href: "/reports", icon: BarChart3, role: "org:viewer" },
  { name: "Optimization", href: "/optimization", icon: Zap, role: "org:member" },
  { name: "Accounts", href: "/accounts", icon: CloudCog, role: "org:admin" },
  { name: "Billing", href: "/billing", icon: CreditCard, role: "org:owner" },
  { name: "Settings", href: "/settings", icon: Settings, role: "org:admin" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { orgRole } = useAuth()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <Zap className="h-6 w-6" />
          <span>AWS <span className="text-foreground">Cost Alert</span></span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6">
        <nav className="grid gap-1 px-4">
          {navItems.map((item) => {
            if (!hasMinimumRole(orgRole, item.role as OrganizationRole)) return null;
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive 
                    ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Support & Profile */}
      <div className="border-t p-4">
        <div className="mb-4 rounded-xl bg-primary-tint p-4">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">Need Help?</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Contact our cloud cost experts.
          </p>
          <Button variant="link" className="mt-2 h-auto p-0 text-xs">
            Open Support Ticket
          </Button>
        </div>

      </div>
    </div>
  )
}
