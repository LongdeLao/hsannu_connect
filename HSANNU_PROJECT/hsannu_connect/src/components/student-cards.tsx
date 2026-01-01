"use client"

import React, { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { UserCheck, Clock, AlertCircle, Users, Calendar, BookOpen, MoreVertical, Check, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

import { getSubjectIconForName } from "@/lib/subjects"
import { convertUTCToShanghaiTime } from "@/lib/utils"


interface Student {
  user_id?: number
  id?: number
  name: string
  today: string
  arrival_time?: string
  image_url?: string
  profile_image?: string
  avatar?: string
}

interface StudentCardsProps {
  students: Student[]
  onAttendanceChange?: (studentId: number, status: string) => Promise<void>
  onMarkArrival?: (studentId: number) => Promise<void>
  hasAttendanceRole?: boolean
  selectedStudents?: Set<number>
  onStudentSelect?: (studentId: number, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
  onBulkAttendanceChange?: (status: string) => Promise<void>
  bulkLoading?: boolean
}

interface StudentInfoApiResponse {
  student: {
    id: number
    first_name?: string
    last_name?: string
    full_name?: string
    formal_picture?: string
    year_group?: string
    group_name?: string
    classes?: Array<{
      subject: string
      code?: string
      initials?: string
      teaching_group?: string
      teacher_id?: number
      teacher_name?: string
    }>
    attendance?: {
      present?: number
      absent?: number
      late?: number
      medical?: number
      early?: number
      today?: string
    }
  }
  success: boolean
}

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-muted-foreground"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  )
}

export function StudentCards({ 
  students, 
  onAttendanceChange, 
  onMarkArrival,
  hasAttendanceRole,
  selectedStudents,
  onStudentSelect,
  onSelectAll,
  onBulkAttendanceChange,
  bulkLoading
}: StudentCardsProps) {
  const [active, setActive] = useState<Student | null>(null)
  const [info, setInfo] = useState<StudentInfoApiResponse | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [loadingStudentId, setLoadingStudentId] = useState<number | null>(null)
  const { toast } = useToast()

  const ref = useRef<HTMLDivElement>(null)
  const id = useId()


  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null)
      }
    }

    if (active) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [active])

  useOutsideClick(ref, () => setActive(null))

  useEffect(() => {
    const fetchInfo = async (userId: number | string) => {
      try {
        setInfoLoading(true)
        setInfoError(null)
        setInfo(null)
        const res = await fetch(`https://connect.hsannu.com/api/get_student_information?userid=${userId}`, {
          cache: 'no-store'
        })
        if (!res.ok) throw new Error(`Failed to load student info (${res.status})`)
        const data: StudentInfoApiResponse = await res.json()
        setInfo(data)
      } catch (err) {
        setInfoError(err instanceof Error ? err.message : 'Failed to load student info')
      } finally {
        setInfoLoading(false)
      }
    }

    const userId = active ? (active.user_id || active.id) : null
    if (userId) {
      fetchInfo(userId)
    } else {
      setInfo(null)
    }
  }, [active])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Present": return "outline"
      case "Late": return "secondary"
      case "Absent": return "destructive"
      case "Medical": return "outline"
      case "Pending": return "secondary"
      default: return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present": return <UserCheck className="w-3 h-3" />
      case "Late": return <Clock className="w-3 h-3" />
      case "Absent": return <AlertCircle className="w-3 h-3" />
      case "Medical": return <UserCheck className="w-3 h-3" />
      case "Pending": return <Clock className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }



  const getImageUrl = (student: Student) => {
    const userId = student.user_id || student.id
    if (userId) {
      // For demo privacy, always use placeholder
  return "/placeholder-avatar.svg"
    }
    return "/placeholder-avatar.svg"
  }

  const getStudentId = (student: Student) => {
    return student.user_id || student.id || 'N/A'
  }

  const handleAttendanceChange = async (student: Student, status: string) => {
    if (!onAttendanceChange || !hasAttendanceRole) return
    
    const studentId = student.user_id || student.id
    if (!studentId) {
      toast({
        title: "Error",
        description: "Student ID not found",
        variant: "destructive",
      })
      return
    }

    setLoadingStudentId(studentId)
    
    try {
      await onAttendanceChange(studentId, status)
      
      toast({
        title: "Attendance Updated",
        description: `Marked ${student.name} as ${status}`,
      })
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStudentId(null)
    }
  }

  const renderInfoContent = () => {
    if (infoLoading) {
      return (
        <div className="space-y-4 min-h-[24rem]">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3 border-0 shadow-none">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-3 w-12" />
            </Card>
            <Card className="p-3 border-0 shadow-none">
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-3 w-16" />
            </Card>
          </div>
          <Card className="p-4 border-0 shadow-none">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-none">
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        </div>
      )
    }
    if (infoError) {
      return (
        <Card className="p-4 bg-destructive/10 border-0 shadow-none">
          <div className="text-sm text-destructive">{infoError}</div>
        </Card>
      )
    }
    if (!info?.success || !info.student) {
      return null
    }

    const s = info.student
    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
      >
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3 border-0 shadow-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">Year Group</span>
            </div>
            <p className="text-base font-semibold text-foreground">{s.year_group || '—'}</p>
          </Card>
          <Card className="p-3 border-0 shadow-none">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Group</span>
            </div>
            <p className="text-base font-semibold text-foreground">{s.group_name || '—'}</p>
          </Card>
        </div>

        {/* Attendance Summary - subdued */}
        {s.attendance && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-2 pt-0">
              <div className="text-center p-1 bg-muted rounded-md">
                <p className="text-sm font-semibold text-foreground">{s.attendance.present ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-1 bg-muted rounded-md">
                <p className="text-sm font-semibold text-foreground">{s.attendance.late ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Late</p>
              </div>
              <div className="text-center p-1 bg-muted rounded-md">
                <p className="text-sm font-semibold text-foreground">{s.attendance.absent ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-1 bg-muted rounded-md">
                <p className="text-sm font-semibold text-foreground">{s.attendance.medical ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Medical</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classes */}
        {Array.isArray(s.classes) && s.classes.length > 0 && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Current Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {s.classes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                      {(() => { const Icon = getSubjectIconForName(c.subject); return <Icon className="h-3.5 w-3.5" />; })()}
                      {c.subject}
                    </p>
                    {c.code && <p className="text-xs text-muted-foreground">{c.code}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.teacher_name || c.initials || '—'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.button
              key={`button-${active.name}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-4 right-4 lg:hidden items-center justify-center bg-background rounded-full h-8 w-8 shadow-md z-20"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            
            <motion.div
              layoutId={`card-${active.name}-${id}`}
              ref={ref}
              className="w-full max-w-5xl h-full md:h-[60vh] md:max-h-[70%] flex flex-col md:flex-row bg-background rounded-xl shadow-lg overflow-hidden"
            >
              <motion.div 
                layoutId={`image-${active.name}-${id}`}
                className="relative md:w-[44%] lg:w-[48%] shrink-0"
              >
                <img
                  width={200}
                  height={200}
                  src={getImageUrl(active)}
                  alt={active.name}
                  className="w-full h-64 md:h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-avatar.svg"
                  }}
                />
                {/* Removed dark overlay to keep visuals clean and gray */}
              </motion.div>

              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex justify-between items-start p-4">
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      layoutId={`title-${active.name}-${id}`}
                      className="text-lg font-semibold text-foreground truncate"
                    >
                      {active.name}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${getStudentId(active)}-${id}`}
                      className="text-xs text-muted-foreground mt-1"
                    >
                      Student ID: {getStudentId(active)}
                      {active.arrival_time && ` • Arrived at ${convertUTCToShanghaiTime(active.arrival_time)}`}
                    </motion.p>
                  </div>

                  <motion.div
                    layoutId={`badge-${active.name}-${id}`}
                    className="ml-4 shrink-0"
                  >
                    <Badge variant={getStatusBadgeVariant(active.today)} className="gap-1">
                      {getStatusIcon(active.today)}
                      {active.today}
                    </Badge>
                  </motion.div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {renderInfoContent()}
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      
      {/* Bulk Operations Header */}
      {hasAttendanceRole && selectedStudents && onStudentSelect && onSelectAll && onBulkAttendanceChange && students.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedStudents.size === students.length && students.length > 0}
                onCheckedChange={onSelectAll}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
            {selectedStudents.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedStudents.size} selected
              </span>
            )}
          </div>
          
          {selectedStudents.size > 0 && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkLoading}
                    className="text-xs"
                  >
                    {bulkLoading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-transparent mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Mark Selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onBulkAttendanceChange('Present')}
                    className="cursor-pointer"
                  >
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Present
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onBulkAttendanceChange('Late')}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                    Late
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onBulkAttendanceChange('Absent')}
                    className="cursor-pointer"
                  >
                    <X className="mr-2 h-4 w-4 text-red-600" />
                    Absent
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onBulkAttendanceChange('Medical')}
                    className="cursor-pointer"
                  >
                    <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                    Medical
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onBulkAttendanceChange('Pending')}
                    className="cursor-pointer text-muted-foreground"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Pending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectAll(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Student List */}
      <div className="space-y-3">
        {students.map((student) => {
          const studentId = student.user_id || student.id
          const isLoading = loadingStudentId === studentId
          
          return (
            <motion.div
              layoutId={`card-${student.user_id || student.id}`}
              key={student.user_id || student.id}
              className="p-4 flex flex-col md:flex-row justify-between items-center rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {hasAttendanceRole && selectedStudents && onStudentSelect && (
                  <Checkbox
                    checked={selectedStudents.has(studentId as number)}
                    onCheckedChange={(checked) => onStudentSelect(studentId as number, !!checked)}
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div 
                  onClick={() => setActive(student)}
                  className="flex gap-4 flex-col md:flex-row items-center md:items-start cursor-pointer flex-1"
                >
                <motion.div layoutId={`image-${student.name}-${id}`}>
                  <img
                    width={100}
                    height={100}
                    src={getImageUrl(student)}
                    alt={student.name}
                    className="h-16 w-16 md:h-12 md:w-12 rounded-lg object-cover object-center"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-avatar.svg"
                    }}
                  />
                </motion.div>
                <div className="text-center md:text-left">
                  <motion.h3
                    layoutId={`title-${student.name}-${id}`}
                    className="font-medium text-foreground"
                  >
                    {student.name}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${getStudentId(student)}-${id}`}
                    className="text-muted-foreground text-sm"
                  >
                    {student.arrival_time ? `Arrived at ${convertUTCToShanghaiTime(student.arrival_time)}` : `ID: ${getStudentId(student)}`}
                  </motion.p>
                </div>
              </div>
              
              <motion.div
                layoutId={`badge-${student.name}-${id}`}
                className="mt-4 md:mt-0 flex items-center gap-2"
              >
                <Badge variant={getStatusBadgeVariant(student.today)} className="gap-1">
                  {getStatusIcon(student.today)}
                  {student.today}
                </Badge>
                
                {hasAttendanceRole && onAttendanceChange && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted/80"
                        disabled={isLoading}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                        <span className="sr-only">Mark attendance</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAttendanceChange(student, 'Present')
                        }}
                        className="cursor-pointer"
                      >
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Present
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAttendanceChange(student, 'Late')
                        }}
                        className="cursor-pointer"
                      >
                        <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                        Late
                      </DropdownMenuItem>
                      {student.today === 'Late' && onMarkArrival && !student.arrival_time && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            const studentId = student.user_id || student.id
                            if (studentId) {
                              onMarkArrival(studentId)
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <Clock className="mr-2 h-4 w-4 text-orange-600" />
                          Mark Arrival
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                        handleAttendanceChange(student, 'Absent')
                        }}
                        className="cursor-pointer"
                      >
                        <X className="mr-2 h-4 w-4 text-red-600" />
                        Absent
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAttendanceChange(student, 'Medical')
                        }}
                        className="cursor-pointer"
                      >
                        <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                        Medical
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAttendanceChange(student, 'Pending')
                        }}
                        className="cursor-pointer text-muted-foreground"
                      >
                        Clear to Pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
} 