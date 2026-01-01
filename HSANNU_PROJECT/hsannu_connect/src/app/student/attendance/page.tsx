'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Home, ChevronRight, Calendar, Check, X, AlertCircle, Clock, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { 
  fetchStudentAttendanceHistory, 
  type StudentWithFullHistory, 
  type AttendanceHistory 
} from '@/lib/api';

interface AttendanceResponse {
  success: boolean;
  student: StudentWithFullHistory;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'medical' | 'early';
  attendance_date: string;
  arrived_at: string | null;
  created_at: string;
}

interface ActivityData {
  label: string;
  value: number;
  color: string;
  size: number;
  current: number;
  target: number;
  unit: string;
}

interface CircleProgressProps {
  data: ActivityData;
  index: number;
}

const CircleProgress = ({ data, index }: CircleProgressProps) => {
  const strokeWidth = 16;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;

  const gradientId = `gradient-${data.label.toLowerCase()}`;
  const gradientUrl = `url(#${gradientId})`;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
    >
      <div className="relative">
        <svg
          width={data.size}
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          className="transform -rotate-90"
          aria-label={`${data.label} Progress - ${data.value}%`}
        >
          <title>{`${data.label} Progress - ${data.value}%`}</title>

          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: data.color,
                  stopOpacity: 1,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: data.color,
                  stopOpacity: 0.8,
                }}
              />
            </linearGradient>
          </defs>

          <circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />

          <motion.circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke={gradientUrl}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{
              duration: 1.8,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(0,0,0,0.15))",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

const DetailedActivityInfo = ({ activities }: { activities: ActivityData[] }) => {
  return (
    <motion.div
      className="flex flex-col gap-6 ml-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {activities.map((activity) => (
        <motion.div key={activity.label} className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            {activity.label}
          </span>
          <span
            className="text-2xl font-semibold"
            style={{ color: activity.color }}
          >
            {activity.current}/{activity.target}
            <span className="text-base ml-1 text-muted-foreground">
              {activity.unit}
            </span>
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

const AttendanceActivityCard = ({ summary }: { summary: any }) => {
  if (!summary) return null;

  const createActivityData = () => {
    const total = summary.total || 1; // Avoid division by zero
    
    return [
      { name: 'Present', value: summary.present, color: '#22c55e', percentage: (summary.present / total) * 100 },
      { name: 'Late', value: summary.late, color: '#f59e0b', percentage: (summary.late / total) * 100 },
      { name: 'Absent', value: summary.absent, color: '#ef4444', percentage: (summary.absent / total) * 100 },
      { name: 'Medical', value: summary.medical, color: '#3b82f6', percentage: (summary.medical / total) * 100 },
      { name: 'Early', value: summary.early, color: '#8b5cf6', percentage: (summary.early / total) * 100 }
    ].filter(item => item.value > 0);
  };

  const activityData = createActivityData();
  const attendanceRate = summary.percentage || 0;

  return (
    <Card className="bg-background shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Attendance Overview</h3>
              <p className="text-sm text-muted-foreground">Your attendance pattern at a glance</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {activityData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.name}</div>
                </div>
            ))}
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${attendanceRate}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{attendanceRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Attendance</div>
                </div>
              </div>
        </div>
      </div>
    </div>
      </CardContent>
    </Card>
  );
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'present':
      return <Check className="w-4 h-4" />;
    case 'late':
      return <Clock className="w-4 h-4" />;
    case 'absent':
      return <X className="w-4 h-4" />;
    case 'medical':
      return <Stethoscope className="w-4 h-4" />;
    case 'early':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        // Get actual student ID from authentication context if available
        // Fallback to hardcoded ID 1422 if not (to preserve current behaviour)
        const studentId = user?.id ? Number(user.id) : 1422;
        const studentData = await fetchStudentAttendanceHistory(studentId);
        
        setAttendanceData({
          success: true,
          student: studentData
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load attendance data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [toast, user?.id]);

  // Leave requests state and handlers
  interface LeaveRequest {
    id: number;
    student_id: number;
    student_name: string;
    request_type: string;
    reason?: string | null;
    status: string;
    created_at: string;
  }

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [reqType, setReqType] = useState('absence');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      if (!user?.id) return;
      const sid = Number(user.id);
  const resp = await fetch(`${API_BASE_URL}/leave-requests/student/${sid}`);
      if (!resp.ok) throw new Error('Failed to fetch leave requests');
      const data = await resp.json();
      // Expecting { success: true, requests: [...] }
      setLeaveRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    // Fetch leave requests when user is available
    if (user?.id) fetchLeaveRequests();
  }, [user?.id, fetchLeaveRequests]);

  const handleCreateLeaveRequest = async () => {
    if (!user?.id) return;
    if (!reqType) return;
    try {
      setIsSubmitting(true);
      const body = {
        student_id: Number(user.id),
        student_name: user.name || '',
        request_type: reqType,
        reason: reason || null,
      };
  const resp = await fetch(`${API_BASE_URL}/leave-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed to create leave request');
      // refresh list
      await fetchLeaveRequests();
      setShowLeaveModal(false);
      setReason('');
    } catch (err) {
      console.error('Error creating leave request:', err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create request', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (requestId: number) => {
    try {
      // Double confirmation
      if (!confirm('Are you sure you want to cancel this leave request?')) return
      if (!confirm('This action cannot be undone. Confirm cancel request.')) return

      const userId = user?.id ? Number(user.id) : null
      const resp = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: userId })
      })

      const data = await resp.json()
      if (!resp.ok || !data.success) throw new Error(data?.message || 'Failed to cancel leave request')

      // Remove from local list
      setLeaveRequests(prev => prev.filter(l => l.id !== requestId))
      toast({ title: 'Cancelled', description: 'Your leave request has been cancelled.' })
    } catch (err) {
      console.error('Error cancelling leave request:', err)
      toast({ title: 'Error', description: err instanceof Error ? err.message : String(err), variant: 'destructive' })
    }
  };

  // Calculate summary from the new stats structure
  const summary = attendanceData?.student.stats;

  // Get today's status from the same history array used in Recent Records
  const getTodayStatus = () => {
    if (!attendanceData?.student.history || attendanceData.student.history.length === 0) {
      return null;
    }
    
    // Get today's date and normalize it
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    
    // Find today's record in the history array (same array used in Recent Records)
    const todayRecord = attendanceData.student.history.find((record) => {
      if (!record.attendance_date) return false;
      
      // Parse the record date and normalize it
      const recordDate = new Date(record.attendance_date);
      recordDate.setHours(0, 0, 0, 0);
      
      // Compare dates (ignoring time)
      return recordDate.getTime() === today.getTime();
    });
    
    // If found in Recent Records, return its status
    if (todayRecord) {
      return {
        status: todayRecord.status,
        arrived_at: todayRecord.arrived_at
      };
    }
    
    // If not found, return null (will show as Pending)
    return null;
  };

  const todayStatus = getTodayStatus();

  // (activity data is created inside AttendanceActivityCard)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'late':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'absent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medical':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'early':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const AttendancePageSkeleton = () => (
    <div className="p-6">
      {/* Breadcrumbs Skeleton */}
      <div className="mb-4">
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Overview Card Skeleton */}
      <Card className="bg-background shadow-none mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
                  </div>
                </div>
            
            <div className="flex items-center justify-center">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Records Card Skeleton */}
      <Card className="bg-background shadow-none">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/student" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Attendance</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your attendance patterns and progress
          </p>
        </div>

        {/* Leave request action for students */}
        <div className="ml-4">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="inline-flex items-center px-3 py-2 bg-primary text-white rounded-md shadow hover:opacity-95"
          >
            Request Leave
          </button>
        </div>
      </div>

      {loading ? (
        <AttendancePageSkeleton />
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-medium text-destructive">Error Loading Attendance</h3>
                <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's Status */}
          {attendanceData?.student && (
            <Card className="bg-background shadow-none mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-lg border",
                      todayStatus 
                        ? getStatusColor(todayStatus.status)
                        : 'text-gray-600 bg-gray-50 border-gray-200'
                    )}>
                      {todayStatus 
                        ? getStatusIcon(todayStatus.status)
                        : <Clock className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Today's Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {todayStatus?.arrived_at && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Arrived at {todayStatus.arrived_at}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-medium text-base px-4 py-2",
                      todayStatus 
                        ? getStatusColor(todayStatus.status)
                        : 'text-gray-600 bg-gray-50 border-gray-200'
                    )}
                  >
                    {todayStatus 
                      ? capitalizeStatus(todayStatus.status)
                      : 'Pending'
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview */}
          <AttendanceActivityCard summary={summary} />

          {/* Recent Records */}
          <Card className="bg-background shadow-none mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Recent Records</h3>
              
              {attendanceData?.student.history && attendanceData.student.history.length > 0 ? (
                <div className="space-y-3">
                  {attendanceData.student.history.slice(0, 10).map((record) => (
                  <motion.div 
                    key={record.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg border",
                          getStatusColor(record.status)
                        )}>
                      {getStatusIcon(record.status)}
                        </div>
                      <div>
                          <p className="font-medium text-foreground">
                          {new Date(record.attendance_date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                            day: 'numeric'
                          })}
                          </p>
                          {record.arrived_at && (
                            <p className="text-sm text-muted-foreground">
                              Arrived at {record.arrived_at}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Recorded at {new Date(record.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className={cn("font-medium", getStatusColor(record.status))}
                      >
                        {capitalizeStatus(record.status)}
                      </Badge>
                  </motion.div>
                ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Leave requests list for student */}
          <Card className="bg-background shadow-none mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Leave Requests</h3>
              {leaveRequests && leaveRequests.length > 0 ? (
                <div className="space-y-3">
                  {leaveRequests.map((lr) => (
                    <div key={lr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                      <div>
                        <div className="font-medium">{lr.request_type ?? 'Leave'}</div>
                        <div className="text-sm text-muted-foreground">{lr.reason ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">Submitted: {new Date(lr.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium">
                          {String(lr.status).charAt(0).toUpperCase() + String(lr.status).slice(1)}
                        </Badge>

                        {lr.status === 'pending' && (
                          <button title="Cancel request" onClick={() => cancelRequest(lr.id)} className="text-muted-foreground hover:text-destructive px-2 py-1 rounded">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">You have no leave requests</div>
              )}
            </CardContent>
          </Card>

          {/* Leave request modal */}
          <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
            <DialogContent title="Request Leave" className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a leave request for your attendance record.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="leave-type">Type</Label>
                  <Select value={reqType} onValueChange={setReqType}>
                    <SelectTrigger id="leave-type" className="w-full">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absence">Absence</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="early">Early Release</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-reason">Reason (optional)</Label>
                  <Textarea
                    id="leave-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for leave request..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLeaveRequest}
                  disabled={isSubmitting || !reqType}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 