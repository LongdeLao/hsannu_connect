"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Calendar, Users, UserCheck, Clock, AlertCircle, Home, ChevronRight, AlertTriangle, Check, X, MoreVertical, ClockIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { StudentCards } from "@/components/student-cards"
import { 
  fetchAttendanceStatusByYearGroup, 
  updateStudentAttendance, 
  markStudentArrival,
  deleteAttendanceRecord,
  type StudentAttendanceStatus,
  type AttendanceUpdateRequest
} from "@/lib/api"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { API_BASE_URL } from "@/config"

const YEAR_CONFIG = {
  ib1: { label: "IB1", apiYear: "IB1" },
  ib2: { label: "IB2", apiYear: "IB2" },
  pib: { label: "PIB", apiYear: "PIB" },
} as const

// Convert new attendance status to legacy Student format for compatibility with StudentCards
interface LegacyStudent {
  user_id: number
  name: string
  year: string
  group_name: string
  today: string
  arrival_time?: string
  present: number
  absent: number
  late: number
  medical: number
  early: number
}

function convertToLegacyStudent(student: StudentAttendanceStatus): LegacyStudent {
  const capitalizeStatus = (status: string) => {
    switch (status) {
      case 'present': return 'Present'
      case 'absent': return 'Absent'
      case 'late': return 'Late'
      case 'medical': return 'Medical'
      case 'early': return 'Early'
      case 'pending': return 'Pending'
      default: return status
    }
  }

  return {
    user_id: student.user_id,
    name: student.name,
    year: student.year,
    group_name: student.group_name,
    today: capitalizeStatus(student.current_status),
    arrival_time: student.arrived_at,
    // Legacy fields not used in new system
    present: 0,
    absent: 0,
    late: 0,
    medical: 0,
    early: 0,
  }
}

export default function AttendanceYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params)
  const yearKey = useMemo(() => (year || "").toLowerCase(), [year]) as string
  const config = useMemo(() => (YEAR_CONFIG as Record<string, { label: string; apiYear: string }>)[yearKey], [yearKey])
  const isValidYear = !!config

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<LegacyStudent[]>([])
  const [rawStudents, setRawStudents] = useState<StudentAttendanceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttendanceRole, setHasAttendanceRole] = useState(false)
  const [roleCheckLoading, setRoleCheckLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    // Check user role and attendance permissions
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
  const hasAttendancePermission = user.additional_roles?.includes('attendance') || user.role === 'admin';
  setHasAttendanceRole(hasAttendancePermission);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setHasAttendanceRole(false);
      }
    }
    setRoleCheckLoading(false);
  }, []);

  // Admin leave-requests panel state
  interface LeaveRequest {
    id: number
    student_id: number
    student_name: string
    request_type: string
    reason?: string | null
    status: string
    created_at: string
  }

  const [showRequestsPanel, setShowRequestsPanel] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true)
      setRequestError(null)
      const resp = await fetch(`${API_BASE_URL}/leave-requests/pending`)
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`)
      const data = await resp.json()
      if (data.success) setPendingRequests(data.requests || [])
      else throw new Error(data.message || 'Failed to load requests')
    } catch (error) {
      console.error('Error fetching pending leave requests:', error)
      setRequestError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleRequestDecision = async (requestId: number, approve: boolean) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      const status = approve ? 'approved' : 'rejected'
      const resp = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, staff_id: userData.id, staff_name: userData.name || 'Staff' })
      })
      const data = await resp.json()
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to update request')
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      console.error('Error updating request status:', err)
      setRequestError(err instanceof Error ? err.message : String(err))
    }
  }

  const cancelRequest = async (requestId: number) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')

      // Double confirmation
      if (!confirm('Are you sure you want to cancel this leave request?')) return
      if (!confirm('This action cannot be undone. Confirm cancel request.')) return

      const resp = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: userData.id })
      })

      const data = await resp.json()
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to cancel request')

      // Remove from local list
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success('Leave request cancelled')
    } catch (err) {
      console.error('Error cancelling leave request:', err)
      setRequestError(err instanceof Error ? err.message : String(err))
    }
  }

  const formatDateConsistently = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const loadStudents = useCallback(async () => {
    if (!config) return

    try {
      setLoading(true)
      setError(null)
      
      // Use both sections A and B for the year
      const sectionAPromise = fetchAttendanceStatusByYearGroup(`${config.apiYear.toLowerCase()}-a`, selectedDate).catch(() => null)
      const sectionBPromise = fetchAttendanceStatusByYearGroup(`${config.apiYear.toLowerCase()}-b`, selectedDate).catch(() => null)
      
      const [sectionAData, sectionBData] = await Promise.all([sectionAPromise, sectionBPromise])
      
      const allRawStudents: StudentAttendanceStatus[] = []
      
      if (sectionAData && sectionAData.students) {
        allRawStudents.push(...sectionAData.students)
      }
      
      if (sectionBData && sectionBData.students) {
        allRawStudents.push(...sectionBData.students)
      }
      
      setRawStudents(allRawStudents)
      setStudents(allRawStudents.map(convertToLegacyStudent))
    } catch (error) {
      console.error('Error loading students:', error)
      setError(error instanceof Error ? error.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [config, selectedDate])

  useEffect(() => {
    if (isValidYear) {
      loadStudents()
    }
  }, [isValidYear, loadStudents])

  // Handle bulk student selection
  const handleStudentSelect = (studentId: number, checked: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(studentId)
      } else {
        newSet.delete(studentId)
      }
      return newSet
    })
  }

  // Handle select all students
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.user_id).filter(Boolean) as number[]))
    } else {
      setSelectedStudents(new Set())
    }
  }

  // Handle bulk attendance marking
  const handleBulkAttendanceChange = async (status: string) => {
    if (!hasAttendanceRole || selectedStudents.size === 0) {
      if (!hasAttendanceRole) {
        toast.error('You do not have permission to mark attendance')
      }
      return
    }

    setBulkLoading(true)
    
    try {
      // Skip pending as it's not a valid update status
      if (status.toLowerCase() === 'pending') {
        toast.error('Cannot bulk mark students as pending')
        return
      }
      
      // Convert capitalized status to lowercase for new API
      const apiStatus = status.toLowerCase() as 'present' | 'absent' | 'late' | 'medical' | 'early'

      const updates: AttendanceUpdateRequest = {
          date: selectedDate,
        updates: Array.from(selectedStudents).map(studentId => ({
          student_id: studentId,
          status: apiStatus
        }))
      }

      await updateStudentAttendance(updates)

      // Update local state
      setStudents(prev => prev.map(student => {
        return selectedStudents.has(student.user_id)
          ? { ...student, today: status, arrival_time: undefined }
          : student
      }))

      // Update raw students state
      setRawStudents(prev => prev.map(student => {
        return selectedStudents.has(student.user_id)
          ? { ...student, current_status: apiStatus, arrived_at: undefined }
          : student
      }))

      toast.success(`Marked ${selectedStudents.size} students as ${status}`)
      
      // Clear selection after bulk operation
      setSelectedStudents(new Set())
    } catch (error) {
      console.error('Error updating bulk attendance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update bulk attendance')
    } finally {
      setBulkLoading(false)
    }
  }

  // Handle attendance change
  const handleAttendanceChange = async (studentId: number, status: string) => {
    if (!hasAttendanceRole) {
      toast.error('You do not have permission to mark attendance')
      return
    }

    try {
      // If status is 'pending', delete the attendance record instead of updating
      if (status.toLowerCase() === 'pending') {
        await deleteAttendanceRecord(studentId, selectedDate)

        // Update local state to show as "Pending" (no record)
        setStudents(prev => prev.map(student => 
          student.user_id === studentId
            ? { ...student, today: 'Pending', arrival_time: undefined }
            : student
        ))

        // Update raw students state - set to pending
        setRawStudents(prev => prev.map(student => 
          student.user_id === studentId
            ? { ...student, current_status: 'pending' as any, arrived_at: undefined }
            : student
        ))

        const studentName = students.find(s => s.user_id === studentId)?.name || 'Student'
        toast.success(`Reset ${studentName} to pending`)
        return
      }
      
      // Convert capitalized status to lowercase for new API
      const apiStatus = status.toLowerCase() as 'present' | 'absent' | 'late' | 'medical' | 'early'

      const updates: AttendanceUpdateRequest = {
          date: selectedDate,
        updates: [{
          student_id: studentId,
          status: apiStatus
          }]
      }

      await updateStudentAttendance(updates)

      // Update local state
      setStudents(prev => prev.map(student => 
        student.user_id === studentId
          ? { ...student, today: status, arrival_time: undefined }
          : student
      ))

      // Update raw students state
      setRawStudents(prev => prev.map(student => 
        student.user_id === studentId
          ? { ...student, current_status: apiStatus, arrived_at: undefined }
          : student
      ))

      const studentName = students.find(s => s.user_id === studentId)?.name || 'Student'
      toast.success(`Marked ${studentName} as ${status}`)
      
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update attendance')
    }
  }

  // Handle marking late student as arrived
  const handleMarkArrival = async (studentId: number) => {
    if (!hasAttendanceRole) {
      toast.error('You do not have permission to mark arrivals')
      return
    }

    try {
      const result = await markStudentArrival({
        student_id: studentId,
        date: selectedDate
      })

      // Update local state
      setStudents(prev => prev.map(student => 
        student.user_id === studentId
          ? { ...student, arrival_time: result.arrived_at }
          : student
      ))

      // Update raw students state
      setRawStudents(prev => prev.map(student => 
        student.user_id === studentId
          ? { ...student, arrived_at: result.arrived_at }
          : student
      ))

      const studentName = students.find(s => s.user_id === studentId)?.name || 'Student'
      toast.success(`Marked arrival time for ${studentName}`)
      
    } catch (error) {
      console.error('Error marking student arrival:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark student arrival')
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: students.length,
      present: students.filter(s => s.today === 'Present').length,
      late: students.filter(s => s.today === 'Late').length,
      absent: students.filter(s => s.today === 'Absent').length,
      medical: students.filter(s => s.today === 'Medical').length,
      pending: students.filter(s => s.today === 'Pending').length,
    }
  }, [students])

  if (roleCheckLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-4"></div>
          <div className="h-8 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (!isValidYear) {
    return (
      <div className="p-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/staff" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/staff/attendance" className="hover:text-foreground transition-colors">
              Attendance
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Invalid Year</span>
          </nav>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Invalid year group specified. Please select a valid year group.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/staff" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/staff/attendance" className="hover:text-foreground transition-colors">
            Attendance
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{config.label}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{config.label} Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage attendance for {config.label} students
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadStudents} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              {hasAttendanceRole && (
                <Button onClick={async () => { setShowRequestsPanel(true); await fetchPendingRequests(); }}>
                  Admin Requests
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending</span>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-10" /> : stats.pending}</div>
        </div>
      </div>

      {/* Main Content - Students List */}
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
              <StudentCards 
                students={students} 
                onAttendanceChange={handleAttendanceChange}
                onMarkArrival={handleMarkArrival}
                hasAttendanceRole={hasAttendanceRole}
                selectedStudents={selectedStudents}
                onStudentSelect={handleStudentSelect}
                onSelectAll={handleSelectAll}
                onBulkAttendanceChange={handleBulkAttendanceChange}
                bulkLoading={bulkLoading}
              />
              <div className="flex justify-between items-center mt-6 pt-2">
                <p className="text-sm text-muted-foreground">
                  {stats.present + stats.late} of {stats.total} students accounted for ({stats.pending} pending)
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

      {/* Admin Requests Panel (modal) */}
      {showRequestsPanel && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
          <div className="w-full max-w-3xl p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b">
                <div>
                  <h3 className="text-lg font-medium">Pending Leave Requests</h3>
                  <p className="text-sm text-muted-foreground">Approve or reject student leave requests</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border rounded" onClick={() => { fetchPendingRequests(); }}>Refresh</button>
                  <button className="px-3 py-1 border rounded" onClick={() => setShowRequestsPanel(false)}>Close</button>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-auto">
                {loadingRequests ? (
                  <div>Loading...</div>
                ) : requestError ? (
                  <div className="text-sm text-destructive">{requestError}</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pending requests</div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((r) => (
                      <div key={r.id} className="relative flex items-center justify-between p-3 rounded bg-muted/20">
                        <div>
                          <div className="font-medium">{r.student_name} — {r.request_type}</div>
                          <div className="text-sm text-muted-foreground">{r.reason ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">Submitted: {new Date(r.created_at).toLocaleString()}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* If the current user is the requester and request is still pending, allow cancel */}
                          {(() => {
                            try {
                              const u = JSON.parse(localStorage.getItem('user') || '{}')
                              if (u && u.id && u.id === r.student_id && r.status === 'pending') {
                                return (
                                  <button title="Cancel request" onClick={() => cancelRequest(r.id)} className="text-muted-foreground hover:text-destructive px-2 py-1 rounded">
                                    <X className="h-4 w-4" />
                                  </button>
                                )
                              }
                            } catch {
                              // ignore parse errors
                            }
                            return null
                          })()}

                          {/* Dropdown for approve/reject - neutral black & white style */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="px-2 py-1 rounded border border-border bg-background text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-foreground" onClick={() => handleRequestDecision(r.id, true)}>Approve</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-foreground" onClick={() => handleRequestDecision(r.id, false)}>Reject</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}