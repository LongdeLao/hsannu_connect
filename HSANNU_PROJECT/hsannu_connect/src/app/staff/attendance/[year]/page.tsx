"use client"

import { use, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Users, UserCheck, Clock, AlertCircle, Home, ChevronRight } from "lucide-react"
import { StudentCards } from "@/components/student-cards"
import { fetchStudentsByYear, type Student } from "@/lib/api"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const YEAR_CONFIG = {
  ib1: { label: "IB1", apiYear: "IB1" },
  ib2: { label: "IB2", apiYear: "IB2" },
  pib: { label: "PIB", apiYear: "PIB" },
} as const

export default function AttendanceYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params)
  const yearKey = useMemo(() => (year || "").toLowerCase(), [year]) as string
  const config = useMemo(() => (YEAR_CONFIG as Record<string, { label: string; apiYear: string }>)[yearKey], [yearKey])
  const isValidYear = !!config

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const formatDateConsistently = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    if (!isValidYear) return
    async function loadStudents() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchStudentsByYear(config.apiYear)
        setStudents(response.students)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [isValidYear, config?.apiYear])

  const stats = {
    total: students.length,
    present: students.filter(s => s.today === "Present").length,
    late: students.filter(s => s.today === "Late").length,
    absent: students.filter(s => s.today === "Absent").length,
    medical: students.filter(s => s.today === "Medical").length,
  }

  const subtitle = !isValidYear
    ? "Unknown program"
    : config.label === "PIB"
      ? "Pre-IB Program attendance overview"
      : `International Baccalaureate Year ${config.label === 'IB1' ? '1' : '2'} overview`

  return (
    <div className="p-6 pt-8">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Attendance</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{isValidYear ? config.label : 'Unknown'}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{isValidYear ? `${config.label} Attendance` : 'Attendance'}</h1>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-md text-sm bg-muted text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Stats overview (borderless) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Students</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-12" /> : stats.total}</div>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Present</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-10" /> : stats.present}</div>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Late</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-10" /> : stats.late}</div>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Absent</span>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-10" /> : stats.absent}</div>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Medical</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-10" /> : stats.medical}</div>
        </div>
      </div>

      {/* Students List (borderless) */}
      <div className="rounded-2xl bg-muted/30">
        <div className="px-4 sm:px-5 py-4">
          <h3 className="text-base font-medium">Student Attendance</h3>
          <p className="text-sm text-muted-foreground">Overview for {formatDateConsistently(selectedDate)}</p>
        </div>
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <StudentCards students={students} />
              <div className="flex justify-between items-center mt-6 pt-2">
                <p className="text-sm text-muted-foreground">
                  {stats.present + stats.late} of {stats.total} students accounted for
                </p>
                <div className="flex gap-2">
                  <Button variant="outline">Export</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 