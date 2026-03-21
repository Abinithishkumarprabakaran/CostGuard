import { Bell, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs"

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <OrganizationSwitcher 
          hidePersonal
          afterCreateOrganizationUrl="/"
          afterLeaveOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
        />
      </div>
      
      <div className="flex items-center gap-4">
        {/* Mock Date Picker */}
        <div className="hidden items-center rounded-md border px-3 py-1.5 text-sm text-muted-foreground sm:flex">
          <span className="font-medium text-foreground mr-2">View:</span>
          Last 30 Days
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </div>

        <div className="ml-2 flex items-center justify-center">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  )
}
