import { Home, ChevronRight } from "lucide-react"
import Link from "next/link"
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog"

export default function StudentDashboardPage() {
  return (
    <div className="relative p-8 md:p-12">
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Student Dashboard</span>
        </nav>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2">Your academic snapshot</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 md:gap-8">
        <section className="rounded-2xl bg-transparent p-6 md:p-8 shadow-none">
          <h2 className="mb-4 text-base font-medium text-foreground">Schedule</h2>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
            <div className="h-4 w-1/3 rounded bg-muted/20" />
          </div>
        </section>
        <section className="rounded-2xl bg-transparent p-6 md:p-8 shadow-none">
          <h2 className="mb-4 text-base font-medium text-foreground">Classes</h2>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
            <div className="h-4 w-1/3 rounded bg-muted/20" />
          </div>
        </section>
        <section className="rounded-2xl bg-transparent p-6 md:p-8 shadow-none">
          <h2 className="mb-4 text-base font-medium text-foreground">Assignments</h2>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
            <div className="h-4 w-1/3 rounded bg-muted/20" />
          </div>
        </section>
        <section className="rounded-2xl bg-transparent p-6 md:p-8 shadow-none">
          <h2 className="mb-4 text-base font-medium text-foreground">Messages</h2>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
            <div className="h-4 w-1/3 rounded bg-muted/20" />
          </div>
        </section>
        <section className="rounded-2xl bg-transparent p-6 md:p-8 shadow-none">
          <h2 className="mb-4 text-base font-medium text-foreground">Tasks</h2>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
            <div className="h-4 w-1/3 rounded bg-muted/20" />
          </div>
        </section>
        <section className="rounded-2xl bg-transparent p-6 md:p-8 shadow-none">
          <h2 className="mb-4 text-base font-medium text-foreground">Insights</h2>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/30" />
            <div className="h-4 w-1/3 rounded bg-muted/20" />
          </div>
        </section>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Not available yet</p>
          <div className="flex flex-col items-center gap-4">
        <span className="rounded-full bg-primary px-6 py-3 text-center text-2xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          UNDER CONSTRUCTION
        </span>
        <span className="rounded-full bg-secondary px-6 py-3 text-center text-xl font-semibold tracking-tight text-secondary-foreground sm:text-3xl">
          COMING SOON
        </span>
          </div>
        </div>
      </div>

      <OnboardingDialog />
    </div>
  )
} 
 