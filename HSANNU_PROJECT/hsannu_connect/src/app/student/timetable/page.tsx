import Link from "next/link"
import { Home, ChevronRight } from "lucide-react"
import { WeeklyTimetable } from "@/components/timetable/WeeklyTimetable"

export default function StudentTimetablePage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Student Timetable</span>
        </nav>
      </div>

      <div className="mb-6">
      <h1 className="text-2xl font-semibold text-foreground">Student Timetable</h1>
        <p className="text-sm text-muted-foreground mt-1">Week view</p>
      </div>

      <WeeklyTimetable events={[]} />
    </div>
  )
} 