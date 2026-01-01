'use client';

import { useEffect, useState } from 'react';
import { Home, ChevronRight, BookOpen, Users, GraduationCap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { StaffClassesResponse, StaffClass } from '@/lib/api';
import { API_BASE_URL } from '@/config';
import { useCurrentUserId } from '@/hooks/use-current-user-id';

// Helper function to sort teaching groups
const sortTeachingGroups = (a: string, b: string) => {
  const order: Record<string, number> = { 'PIB': 1, 'IB1': 2, 'IB2': 3 };
  if (order[a] && order[b]) return order[a] - order[b];
  if (order[a]) return -1;
  if (order[b]) return 1;
  return a.localeCompare(b);
};

// Helper function to get initials
const getInitials = (firstName?: string, lastName?: string): string => 
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

export default function StaffClassesPage() {
  const [classes, setClasses] = useState<StaffClassesResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const userId = useCurrentUserId();
  const router = useRouter();

  // Check if user is a teacher
  const [isTeacher, setIsTeacher] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check user role and teacher permissions
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const hasTeacherRole = user.additional_roles?.includes('teacher') || user.role === 'staff' || user.role === 'teacher' || user.role === 'admin';
        setIsTeacher(hasTeacherRole);
        setUserRole(user.role);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setIsTeacher(false);
      }
    }
  }, []);

  useEffect(() => {
    if (userId == null || !isTeacher) {
      setLoading(false);
      return;
    }

    const fetchStaffClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/get_subjects_by_teacher/${userId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch classes';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to load your classes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStaffClasses();
  }, [userId, isTeacher, toast]);

  // Group classes by teaching group
  const groupedClasses = classes.reduce((acc, cls) => {
    if (!cls || !cls.teaching_group) return acc;
    let key = cls.teaching_group;
    if (key.startsWith('PIB')) key = 'PIB';
    else if (key.startsWith('IB1')) key = 'IB1';
    else if (key.startsWith('IB2')) key = 'IB2';
    if (!acc[key]) acc[key] = [];
    acc[key].push(cls);
    return acc;
  }, {} as Record<string, StaffClass[]>);

  // Handle class card click
  const handleClassClick = (classItem: StaffClass) => {
    // Navigate to class detail page - you can customize this URL structure
    router.push(`/staff/classes/${classItem.code}`);
  };

  // Loading skeleton component
  const LoadingGrid = () => (
    <div className="space-y-8">
      {/* Group header skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Not a teacher state
  if (!isTeacher) {
    return (
      <div className="p-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/staff" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Classes</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">My Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your teaching schedule and class information
          </p>
        </div>

        {/* Access denied */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
                            You don&apos;t have teacher permissions to view this page. Contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
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
            <span className="text-foreground font-medium">Classes</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">My Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your teaching schedule and class information
          </p>
        </div>

        {/* Error state */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load classes: {error}
          </AlertDescription>
        </Alert>
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
          <span className="text-foreground font-medium">Classes</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your teaching schedule and class information
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingGrid />
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg p-12 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
                            You don&apos;t have any classes assigned yet. Contact an administrator if you believe this is an error.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedClasses)
            .sort(sortTeachingGroups)
            .map((teachingGroup) => (
              <div key={teachingGroup}>
                {/* Teaching Group Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="secondary" className="text-xs">{teachingGroup}</Badge>
                  <div className="text-sm text-muted-foreground">
                    {groupedClasses[teachingGroup].length} class{groupedClasses[teachingGroup].length !== 1 ? 'es' : ''}
                  </div>
                </div>

                {/* Classes Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedClasses[teachingGroup].map((classItem, index) => (
                    <Card 
                      key={`${classItem.code}-${index}`} 
                      className="border-0 shadow-none bg-transparent hover:bg-muted/50 transition-colors duration-200 cursor-pointer group"
                      onClick={() => handleClassClick(classItem)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-secondary text-foreground shadow-sm group-hover:shadow-md transition-shadow">
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{classItem.subject_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {classItem.teaching_group}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {classItem.code}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Users className="h-4 w-4" />
                          <span>{classItem.students.length} student{classItem.students.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        {/* Student Avatars */}
                        {classItem.students.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {classItem.students.slice(0, 8).map((student) => (
                              <Avatar key={student.id} className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                                  {getInitials(student.name, student.last_name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {classItem.students.length > 8 && (
                              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground font-medium">
                                +{classItem.students.length - 8}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
} 