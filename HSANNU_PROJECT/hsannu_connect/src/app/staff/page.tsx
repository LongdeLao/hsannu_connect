import { Home, ChevronRight } from "lucide-react"
import Link from "next/link"
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog"

export default function StaffDashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared/dashboard" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Staff Dashboard</span>
        </nav>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Staff Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Placeholder</p>
      </div>

      <div className="flex flex-col items-center gap-4 py-12">
        <span className="rounded-full bg-primary px-6 py-3 text-center text-2xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          UNDER CONSTRUCTION
        </span>
        <span className="rounded-full bg-secondary px-6 py-3 text-center text-xl font-semibold tracking-tight text-secondary-foreground sm:text-3xl">
          COMING SOON
        </span>
      </div>

      <OnboardingDialog />
    </div>
  )
} 
 