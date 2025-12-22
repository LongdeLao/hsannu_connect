import { Home, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function StaffClassesPage() {
  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Staff Classes</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your teaching schedule and class information
        </p>
      </div>

      {/* Simple placeholder content */}
      <div className="text-center py-12 text-muted-foreground">
        <p>Staff classes page - coming soon</p>
      </div>
    </div>
  )
} 