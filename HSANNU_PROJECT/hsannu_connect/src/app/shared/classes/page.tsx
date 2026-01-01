'use client';

import { useEffect, useState } from 'react';
import { Home, ChevronRight, GraduationCap, User2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StudentInformationResponse, getImageUrl } from '@/lib/api';
import { API_BASE_URL } from '@/config';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { getSubjectIconForName } from '@/lib/subjects';

export default function ClassesPage() {
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

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared/dashboard" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">My Classes</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-6">
          {loading ? (
            <>
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </>
          ) : studentInfo ? (
            <>
              <img
                src={getImageUrl(studentInfo.student.formal_picture)}
                alt={studentInfo.student.full_name}
                className="h-24 w-24 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {studentInfo.student.full_name}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  <span>Student ID: {studentInfo.student.id}</span>
                  <span>•</span>
                  <GraduationCap className="h-4 w-4" />
                  <span>{studentInfo.student.year_group} {studentInfo.student.group_name}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-3 flex items-center gap-2">
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <div className="text-muted-foreground">
              <p>Failed to load classes. Please try again later.</p>
            </div>
          </div>
        ) : studentInfo ? (
          studentInfo.student.classes.map((classItem) => (
            <Card key={classItem.code} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  {(() => { const Icon = getSubjectIconForName(classItem.subject); return <Icon className="h-4 w-4" />; })()}
                  {classItem.subject}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {classItem.teacher_name} ({classItem.initials})
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{classItem.teaching_group}</Badge>
                  <Badge variant="outline">{classItem.code}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}
      </div>
    </div>
  );
} 