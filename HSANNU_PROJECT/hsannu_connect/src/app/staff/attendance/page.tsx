'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { GraduationCap, School, BookOpen, Home, ChevronRight, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';

export default function StaffAttendancePage() {
  const [hasAttendanceRole, setHasAttendanceRole] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, []);

  // Pending leave requests (staff view)
  interface LeaveRequest {
    id: number;
    student_id: number;
    student_name: string;
    request_type: string;
    reason?: string | null;
    status: string;
    created_at: string;
  }

  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      setRequestError(null);
      const resp = await fetch(`${API_BASE_URL}/leave-requests/pending`);
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json();
      if (data.success) setPendingRequests(data.requests || []);
      else throw new Error(data.message || 'Failed to load requests');
    } catch (err) {
      console.error('Error fetching pending leave requests:', err);
      setRequestError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    // Only fetch if user has attendance role
    const userData = localStorage.getItem('user');
    if (!userData) return;
    try {
      const user = JSON.parse(userData);
      const hasAttendancePermission = user.additional_roles?.includes('attendance') || user.role === 'admin';
      if (hasAttendancePermission) fetchPendingRequests();
    } catch {
      // ignore
    }
  }, []);

  const handleRequestDecision = async (requestId: number, approve: boolean) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const status = approve ? 'approved' : 'rejected';
      const resp = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, staff_id: userData.id, staff_name: userData.name || 'Staff' })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to update request');
      // remove from list
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      window.alert(`Request ${approve ? 'approved' : 'rejected'}`);
    } catch (err) {
      console.error('Error updating request status:', err);
      window.alert(err instanceof Error ? err.message : 'Failed to update request');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-4"></div>
          <div className="h-8 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

    // Remove page-level permission check - all staff can view the attendance page
  // Only attendance marking functionality requires the attendance role
  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared/dashboard" className="hover:text-foreground transition-colors">
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
        {hasAttendanceRole && (
          <div className="md:col-span-3">
            <Card className="mb-4">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium">Pending Leave Requests</h3>
                    <p className="text-sm text-muted-foreground">Requests awaiting approval</p>
                  </div>
                  <div>
                    <button onClick={fetchPendingRequests} className="text-sm px-3 py-1 border rounded">Refresh</button>
                  </div>
                </div>

                {loadingRequests ? (
                  <div>Loading...</div>
                ) : requestError ? (
                  <div className="text-sm text-destructive">{requestError}</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pending requests</div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded bg-muted/20">
                        <div>
                          <div className="font-medium">{r.student_name} — {r.request_type}</div>
                          <div className="text-sm text-muted-foreground">{r.reason ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">Submitted: {new Date(r.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleRequestDecision(r.id, true)} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                          <button onClick={() => handleRequestDecision(r.id, false)} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
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
 