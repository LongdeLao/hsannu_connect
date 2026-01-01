 'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Users, BookOpen, Calendar, Home, ChevronRight, MoreVertical, Check, X, Clock, UserCheck, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';
import { useCurrentUserId } from '@/hooks/use-current-user-id';

// Student interface to match the backend response
interface Student {
  id: number;
  name: string;
  last_name: string;
}

// Attendance status type
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'pending';

// Student with attendance interface
interface StudentWithAttendance extends Student {
  attendance?: AttendanceStatus | null;
}

// Class detail interface to match the backend response
interface ClassDetail {
  subject_name: string;
  code: string;
  teaching_group: string;
  students: StudentWithAttendance[];
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = useCurrentUserId();
  
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceLoading, setAttendanceLoading] = useState<number | null>(null);
  const [hasAttendanceRole, setHasAttendanceRole] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const classCode = params?.code as string;

  // Check user role and attendance permissions
  useEffect(() => {
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
  }, []);

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get attendance status display
  const getAttendanceDisplay = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present':
        return { label: 'Present', variant: 'default' as const, icon: Check };
      case 'absent':
        return { label: 'Absent', variant: 'destructive' as const, icon: X };
      case 'late':
        return { label: 'Late', variant: 'secondary' as const, icon: Clock };
      case 'excused':
        return { label: 'Excused', variant: 'outline' as const, icon: UserCheck };
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
      default:
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
    }
  };

  // Handle bulk student selection
  const handleStudentSelect = (studentId: number, checked: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };

  // Handle select all students
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(classDetail?.students.map(s => s.id) || []));
    } else {
      setSelectedStudents(new Set());
    }
  };

  // Handle bulk attendance marking
  const handleBulkAttendanceChange = async (status: AttendanceStatus) => {
    if (!classDetail || selectedStudents.size === 0) return;
    
    setBulkLoading(true);
    
    try {
      // TODO: Replace with actual API call for bulk operation
      // await markBulkAttendance(Array.from(selectedStudents), classDetail.code, selectedDate, status);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setClassDetail(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(student =>
            selectedStudents.has(student.id)
              ? { ...student, attendance: status }
              : student
          )
        };
      });

      toast({
        title: "Bulk Attendance Updated",
        description: `Marked ${selectedStudents.size} students as ${status}`,
      });
      
      // Clear selection after bulk operation
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update bulk attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle attendance marking
  const handleAttendanceChange = async (studentId: number, status: AttendanceStatus | null) => {
    if (!classDetail) return;
    
    setAttendanceLoading(studentId);
    
    try {
      // TODO: Replace with actual API call
      // await markAttendance(studentId, classDetail.code, selectedDate, status);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setClassDetail(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(student =>
            student.id === studentId
              ? { ...student, attendance: status }
              : student
          )
        };
      });

      toast({
        title: "Attendance Updated",
        description: `Marked ${classDetail.students.find(s => s.id === studentId)?.name} as ${status || 'unmarked'}`,
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAttendanceLoading(null);
    }
  };

  // Fetch class details
  const fetchClassDetail = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/get_subjects_by_teacher/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch class details');
      }

      const classes: ClassDetail[] = await response.json();
      
      // Find the specific class by code
      const selectedClass = classes.find(cls => cls.code === classCode);
      
      if (!selectedClass) {
        throw new Error('Class not found');
      }

      setClassDetail(selectedClass);
    } catch (error) {
      console.error('Error fetching class details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load class details');
      toast({
        title: "Error",
        description: "Failed to load class details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchClassDetail();
    }
  }, [userId, classCode]);

  // Handle back navigation
  const handleBack = () => {
    router.push('/staff/classes');
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        {/* Breadcrumbs skeleton */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Class info skeleton */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/staff" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/staff/classes" className="hover:text-foreground transition-colors">
              Classes
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Class Details</span>
          </nav>
        </div>

        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>

        <Alert variant="destructive">
          <AlertDescription>
            {error}. <Button variant="link" onClick={fetchClassDetail} className="p-0 h-auto">Try again</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No class found
  if (!classDetail) {
    return (
      <div className="p-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/staff" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/staff/classes" className="hover:text-foreground transition-colors">
              Classes
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Class Details</span>
          </nav>
        </div>

        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>

        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-1">Class not found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The requested class could not be found.
          </p>
          <Button onClick={handleBack}>Return to Classes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/staff" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/staff/classes" className="hover:text-foreground transition-colors">
            Classes
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{classDetail.subject_name}</span>
        </nav>
      </div>

      {/* Back Navigation */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-6 -ml-4 hover:bg-muted/50 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Classes
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {classDetail.subject_name}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {classDetail.code}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Teaching Group: {classDetail.teaching_group} • {classDetail.students.length} students
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="attendance-date" className="text-sm font-medium">
                Date:
              </Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Marking attendance for {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Class Information Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary text-foreground rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Subject</p>
                <p className="font-medium text-foreground">{classDetail.subject_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary text-foreground rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Group</p>
                <p className="font-medium text-foreground">{classDetail.teaching_group}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary text-foreground rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                <p className="font-medium text-foreground">{classDetail.students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Students
            </CardTitle>
            
            {/* Bulk Actions */}
            {hasAttendanceRole && classDetail && classDetail.students.length > 0 && (
              <div className="flex items-center gap-3">
                {selectedStudents.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedStudents.size} selected
                    </span>
                    <div className="flex items-center gap-1">
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
                            onClick={() => handleBulkAttendanceChange('present')}
                            className="cursor-pointer"
                          >
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            Present
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkAttendanceChange('late')}
                            className="cursor-pointer"
                          >
                            <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                            Late
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkAttendanceChange('absent')}
                            className="cursor-pointer"
                          >
                            <X className="mr-2 h-4 w-4 text-red-600" />
                            Absent
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkAttendanceChange('excused')}
                            className="cursor-pointer"
                          >
                            <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                            Excused
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleBulkAttendanceChange('pending')}
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
                        onClick={() => setSelectedStudents(new Set())}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    </div>
                  </>
                )}
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedStudents.size === classDetail.students.length && classDetail.students.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {classDetail.students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-1">No students enrolled</h3>
              <p className="text-sm text-muted-foreground">
                This class doesn&apos;t have any students enrolled yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classDetail.students.map((student, index) => {
                const attendanceDisplay = getAttendanceDisplay(student.attendance || null);
                const AttendanceIcon = attendanceDisplay.icon;
                
                return (
                  <Card 
                    key={`${student.id}-${index}`}
                    className="border-0 shadow-none bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {hasAttendanceRole && (
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id, !!checked)}
                              className="h-4 w-4"
                            />
                          )}
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={"/placeholder-avatar.svg"}
                              alt="Placeholder"
                            />
                            <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
                              {getInitials(student.name, student.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              {student.name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Student ID: {student.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={attendanceDisplay.variant} className="text-xs flex items-center gap-1">
                            {AttendanceIcon && <AttendanceIcon className="h-3 w-3" />}
                            {attendanceDisplay.label}
                          </Badge>
                          {hasAttendanceRole && (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted/80"
                                disabled={attendanceLoading === student.id}
                              >
                                {attendanceLoading === student.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                                <span className="sr-only">Mark attendance</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleAttendanceChange(student.id, 'present')}
                                className="cursor-pointer"
                              >
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Present
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAttendanceChange(student.id, 'late')}
                                className="cursor-pointer"
                              >
                                <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                                Late
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAttendanceChange(student.id, 'absent')}
                                className="cursor-pointer"
                              >
                                <X className="mr-2 h-4 w-4 text-red-600" />
                                Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAttendanceChange(student.id, 'excused')}
                                className="cursor-pointer"
                              >
                                <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                                Excused
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleAttendanceChange(student.id, 'pending')}
                                className="cursor-pointer text-muted-foreground"
                              >
                                Clear to Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}