import Link from "next/link"
import { GraduationCap, School, BookOpen, Home, ChevronRight } from "lucide-react"

export default function StaffAttendancePage() {
  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Attendance</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Staff Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose a year group</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/staff/attendance/pib" className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl">
          <div className="rounded-xl p-4 sm:p-5 bg-muted/30 hover:bg-muted/60 transition-colors shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
                <School className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">PIB</span>
            </div>
            <div className="text-sm text-muted-foreground">Pre-IB Program attendance</div>
              </div>
        </Link>

        <Link href="/staff/attendance/ib1" className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl">
          <div className="rounded-xl p-4 sm:p-5 bg-muted/30 hover:bg-muted/60 transition-colors shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">IB1</span>
            </div>
            <div className="text-sm text-muted-foreground">IB Year 1 attendance</div>
              </div>
        </Link>

        <Link href="/staff/attendance/ib2" className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl">
          <div className="rounded-xl p-4 sm:p-5 bg-muted/30 hover:bg-muted/60 transition-colors shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">IB2</span>
            </div>
            <div className="text-sm text-muted-foreground">IB Year 2 attendance</div>
              </div>
        </Link>
      </div>
    </div>
  )
} 
 