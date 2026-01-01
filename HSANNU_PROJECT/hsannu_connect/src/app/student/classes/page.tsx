'use client';

import { useEffect, useState } from 'react';
import { Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StudentInformationResponse } from '@/lib/api';
import { API_BASE_URL } from '@/config';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { getSubjectIconForName } from '@/lib/subjects';

export default function StudentClassesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInformationResponse | null>(null);
  const { toast } = useToast();
  const userId = useCurrentUserId();

  useEffect(() => {
    if (userId == null) {
      setLoading(false);
      return;
    }

    const fetchStudentInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/get_student_information?userid=${userId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch student information');
        }
        const data = await response.json();
        setStudentInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load student information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentInfo();
  }, [toast, userId]);

  // Group classes by HL/SL based on code suffix
  const groupedClasses = studentInfo?.student.classes.reduce((acc, classItem) => {
    const level = classItem.code.endsWith('HL') ? 'HL' : 
                 classItem.code.endsWith('SL') ? 'SL' : 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(classItem);
    return acc;
  }, {} as Record<string, typeof studentInfo.student.classes>) || {};

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/student" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">My Classes</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">My Classes</h1>
      </div>

      {/* Classes List */}
      <div className="space-y-8">
        {loading ? (
          // Loading skeletons
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-16" />
                <div className="space-y-4 pl-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p>Failed to load classes. Please try again later.</p>
            </div>
          </div>
        ) : studentInfo ? (
          Object.entries(groupedClasses).map(([level, classes]) => (
            <div key={level} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{level} Classes</h2>
              <div className="space-y-4 pl-4">
                {classes.map((classItem) => (
                  <div
                    key={classItem.code}
                    className="p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground flex items-center gap-2">
                          {(() => { const Icon = getSubjectIconForName(classItem.subject); return <Icon className="h-4 w-4" />; })()}
                          {classItem.subject.replace(/[\u4e00-\u9fa5]+/g, "")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {classItem.teacher_name} ({classItem.initials})
                        </p>
                      </div>
                      <Badge variant="outline">{classItem.code}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
} 