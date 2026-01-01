// API utility functions for fetching data from the server
import { API_URL, API_BASE_URL } from '../config';

// Legacy interfaces for compatibility
export interface YearGroup {
  id: string;
  name: string;
  year: string;
  section: string;
  students: number;
  attendance: number;
}

export interface Student {
  user_id: number;
  name: string;
  year: string;
  group_name: string;
  today: string;
  present: number;
  absent: number;
  late: number;
  medical: number;
  early: number;
}

// New attendance system interfaces
export interface YearGroupSummary {
  id: string;
  name: string;
  year: string;
  section: string;
  total_students: number;
  present_today: number;
  late_today: number;
  absent_today: number;
  medical_today: number;
  early_today: number;
  pending_today: number;
  attendance_rate: string;
}

export interface StudentAttendanceStatus {
  user_id: number;
  name: string;
  year: string;
  group_name: string;
  current_status: 'present' | 'absent' | 'late' | 'medical' | 'early' | 'pending';
  arrived_at?: string; // Only set if status is "late" and student has arrived
}

export interface AttendanceHistory {
  id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'medical' | 'early';
  attendance_date: string; // YYYY-MM-DD format
  arrived_at?: string; // HH:MM:SS format, nullable
  created_at: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  medical: number;
  early: number;
  total: number;
  percentage: number;
}

export interface StudentWithFullHistory {
  user_id: number;
  name: string;
  year: string;
  group_name: string;
  current_status: string;
  arrived_at?: string;
  history: AttendanceHistory[];
  stats: AttendanceStats;
}

// Response interfaces
export interface YearGroupSummaryResponse {
  success: boolean;
  yearGroups: YearGroupSummary[];
  date: string;
}

export interface StudentAttendanceStatusResponse {
  success: boolean;
  yearGroup: {
    year: string;
    section: string;
    fullName: string;
  };
  date: string;
  students: StudentAttendanceStatus[];
}

export interface StudentHistoryResponse {
  success: boolean;
  student: StudentWithFullHistory;
}

export interface AttendanceUpdateRequest {
  date?: string; // optional, defaults to today
  updates: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'late' | 'medical' | 'early' | 'pending';
  }>;
}

export interface AttendanceUpdateResponse {
  success: boolean;
  message: string;
  updatedCount: number;
  date: string;
}

export interface MarkArrivalRequest {
  student_id: number;
  date?: string; // optional, defaults to today
}

export interface MarkArrivalResponse {
  success: boolean;
  message: string;
  student_id: number;
  arrived_at: string;
  date: string;
}

// Legacy interfaces for compatibility
export interface YearGroupDetails {
  year: string;
  section: string;
  fullName: string;
}

export interface StudentsByYearGroupResponse {
  success: boolean;
  yearGroup: YearGroupDetails;
  students: Student[];
  date: string;
}

export interface YearGroupsResponse {
  success: boolean;
  yearGroups: YearGroup[];
}

export interface StudentsByYearResponse {
  success: boolean;
  year: string;
  students: Student[];
  date: string;
}

/**
 * NEW ATTENDANCE SYSTEM FUNCTIONS
 */

/**
 * Fetch year groups with today's attendance summary
 */
export async function fetchYearGroupSummaries(): Promise<YearGroupSummary[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/year-groups`);
    if (!response.ok) {
      throw new Error(`Failed to fetch year group summaries: ${response.statusText}`);
    }
    
    const data: YearGroupSummaryResponse = await response.json();
    if (!data.success) {
      throw new Error('Failed to fetch year group summaries from API');
    }
    
    return data.yearGroups;
  } catch (error) {
    console.error('Error fetching year group summaries:', error);
    throw error;
  }
}

/**
 * Fetch attendance status for students in a year group on a specific date
 */
export async function fetchAttendanceStatusByYearGroup(
  yearGroupId: string, 
  date?: string
): Promise<StudentAttendanceStatusResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/attendance/status/${yearGroupId}`);
    if (date) {
      url.searchParams.set('date', date);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch attendance status for ${yearGroupId}: ${response.statusText}`);
    }
    
    const data: StudentAttendanceStatusResponse = await response.json();
    if (!data.success) {
      throw new Error(`Failed to fetch attendance status for ${yearGroupId}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching attendance status for ${yearGroupId}:`, error);
    throw error;
  }
}

/**
 * Update attendance for multiple students
 */
export async function updateStudentAttendance(updates: AttendanceUpdateRequest): Promise<AttendanceUpdateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: AttendanceUpdateResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update attendance');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating student attendance:', error);
    throw error;
  }
}

/**
 * Delete attendance record for a student on a specific date
 */
export async function deleteAttendanceRecord(studentId: number, date?: string): Promise<{ success: boolean; message: string }> {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0]; // Default to today
    
    const response = await fetch(`${API_BASE_URL}/attendance/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        date: dateParam
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
}

/**
 * Mark a late student as arrived
 */
export async function markStudentArrival(request: MarkArrivalRequest): Promise<MarkArrivalResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/mark-arrival`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: MarkArrivalResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to mark student arrival');
    }
    
    return data;
  } catch (error) {
    console.error('Error marking student arrival:', error);
    throw error;
  }
}

/**
 * Fetch attendance history for a student
 */
export async function fetchStudentAttendanceHistory(studentId: number): Promise<StudentWithFullHistory> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/history/${studentId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch attendance history for student ${studentId}: ${response.statusText}`);
    }
    
    const data: StudentHistoryResponse = await response.json();
    if (!data.success) {
      throw new Error(`Failed to fetch attendance history for student ${studentId}`);
    }
    
    return data.student;
  } catch (error) {
    console.error(`Error fetching attendance history for student ${studentId}:`, error);
    throw error;
  }
}

/**
 * Helper function to convert new attendance status to legacy format for compatibility
 */
export function convertToLegacyStudent(student: StudentAttendanceStatus): Student {
  // Convert lowercase status to capitalized for legacy compatibility
  const capitalizeStatus = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'medical': return 'Medical';
      case 'early': return 'Early';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  return {
    user_id: student.user_id,
    name: student.name,
    year: student.year,
    group_name: student.group_name,
    today: capitalizeStatus(student.current_status),
    // These legacy fields are not available in the new system, so set to 0
    present: 0,
    absent: 0,
    late: 0,
    medical: 0,
    early: 0,
  };
}

/**
 * LEGACY FUNCTIONS FOR COMPATIBILITY
 * These functions provide backward compatibility with the old attendance system
 */

/**
 * Fetch all year groups with their basic information (legacy)
 */
export async function fetchYearGroups(): Promise<YearGroup[]> {
  try {
    // Use the new API but convert to legacy format
    const summaries = await fetchYearGroupSummaries();
    
    return summaries.map(summary => ({
      id: summary.id,
      name: summary.name,
      year: summary.year,
      section: summary.section,
      students: summary.total_students,
      attendance: parseFloat(summary.attendance_rate.replace('%', '')),
    }));
  } catch (error) {
    console.error('Error fetching year groups (legacy):', error);
    throw error;
  }
}

/**
 * Fetch students for a specific year group (legacy)
 */
export async function fetchStudentsByYearGroup(yearGroupId: string): Promise<StudentsByYearGroupResponse> {
  try {
    const data = await fetchAttendanceStatusByYearGroup(yearGroupId);
    
    return {
      success: true,
      yearGroup: data.yearGroup,
      students: data.students.map(convertToLegacyStudent),
      date: data.date,
    };
  } catch (error) {
    console.error(`Error fetching students for year group ${yearGroupId} (legacy):`, error);
    throw error;
  }
}

/**
 * Fetch students for a specific year (PIB, IB1, IB2) (legacy)
 * Note: This is a simplified implementation that fetches both sections
 */
export async function fetchStudentsByYear(year: string): Promise<StudentsByYearResponse> {
  try {
    // Fetch both sections A and B for the year
    const sectionAPromise = fetchAttendanceStatusByYearGroup(`${year.toLowerCase()}-a`).catch(() => null);
    const sectionBPromise = fetchAttendanceStatusByYearGroup(`${year.toLowerCase()}-b`).catch(() => null);
    
    const [sectionAData, sectionBData] = await Promise.all([sectionAPromise, sectionBPromise]);
    
    const allStudents: Student[] = [];
    let date = new Date().toISOString().split('T')[0];
    
    if (sectionAData) {
      allStudents.push(...sectionAData.students.map(convertToLegacyStudent));
      date = sectionAData.date;
    }
    
    if (sectionBData) {
      allStudents.push(...sectionBData.students.map(convertToLegacyStudent));
    }
    
    return {
      success: true,
      year: year.toUpperCase(),
      students: allStudents,
      date,
    };
  } catch (error) {
    console.error(`Error fetching students for year ${year} (legacy):`, error);
    throw error;
  }
}

/**
 * Fetch all students for attendance (used for search and overview) (legacy)
 */
export async function fetchAllStudents(): Promise<Student[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/all-students`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all students: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error('Failed to fetch all students from API');
    }
    
    return data.students;
  } catch (error) {
    console.error('Error fetching all students:', error);
    throw error;
  }
}

// Event-related interfaces and functions
export interface ImageModel {
  filePath: string;
}

export interface Event {
  eventID: string;
  authorID: number;
  authorName: string;
  title: string;
  eventDescription: string;
  images: ImageModel[];
  address: string;
  eventDate: string;
  isWholeDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface EventFormData {
  title: string;
  eventDescription: string;
  address: string;
  eventDate: Date;
  isWholeDay: boolean;
  startTime?: Date;
  endTime?: Date;
  images?: File[];
}

export interface EventsResponse {
  events: Event[];
}

/**
 * Fetch all events
 */
export async function fetchEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data: EventsResponse = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Fetch a single event by ID
 */
export async function fetchEventById(eventID: string): Promise<Event> {
  try {
    const response = await fetch(`${API_BASE_URL}/event/${eventID}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }
    
    const data: { event: Event } = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: EventFormData): Promise<{ eventID: string }> {
  const formData = new FormData();
  
  // Add event data
  formData.append('title', eventData.title);
  formData.append('eventDescription', eventData.eventDescription || '');
  formData.append('address', eventData.address || '');
  formData.append('eventDate', eventData.eventDate.toISOString());
  formData.append('isWholeDay', String(eventData.isWholeDay));
  
  if (!eventData.isWholeDay) {
    if (eventData.startTime) formData.append('startTime', eventData.startTime.toISOString());
    if (eventData.endTime) formData.append('endTime', eventData.endTime.toISOString());
  }

  // Add images if any
  if (eventData.images) {
    for (const image of eventData.images) {
      formData.append('images', image);
    }
  }

  // Add required fields from user data
  const userData = localStorage.getItem('user');
  if (!userData) {
    throw new Error('User not logged in');
  }
  const user = JSON.parse(userData);
  if (!user.id) {
    throw new Error('Invalid user data');
  }

  formData.append('eventID', crypto.randomUUID());
  formData.append('authorID', String(user.id));
  formData.append('authorName', user.name || 'Anonymous');

  const response = await fetch(`${API_BASE_URL}/post_event`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

/**
 * Update an existing event
 */
export async function updateEvent(eventID: string, eventData: Partial<EventFormData>): Promise<void> {
  const formData = new FormData();
  
  // Add event ID
  formData.append('eventID', eventID);
  
  // Add other fields if they exist
  if (eventData.title !== undefined) formData.append('title', eventData.title);
  if (eventData.eventDescription !== undefined) formData.append('eventDescription', eventData.eventDescription);
  if (eventData.address !== undefined) formData.append('address', eventData.address);
  if (eventData.eventDate !== undefined) formData.append('eventDate', eventData.eventDate.toISOString());
  if (eventData.isWholeDay !== undefined) formData.append('isWholeDay', String(eventData.isWholeDay));
  
  if (eventData.isWholeDay === false) {
    if (eventData.startTime) formData.append('startTime', eventData.startTime.toISOString());
    if (eventData.endTime) formData.append('endTime', eventData.endTime.toISOString());
  }

  // Add images if any
  if (eventData.images) {
    for (const image of eventData.images) {
      formData.append('images', image);
    }
  }

  // Add required fields from user data
  const userData = localStorage.getItem('user');
  if (!userData) {
    throw new Error('User not logged in');
  }
  const user = JSON.parse(userData);
  if (!user.id) {
    throw new Error('Invalid user data');
  }

  formData.append('authorID', String(user.id));
  formData.append('authorName', user.name || 'Anonymous');

  const response = await fetch(`${API_BASE_URL}/update_event`, {
    method: 'PUT',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventID: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete_event`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventID }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to delete event';
      try {
        const errorData = await response.json();
        if (errorData?.error) errorMessage = errorData.error;
      } catch {}
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Get the full URL for an image path
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    // Return a placeholder image URL or empty string
    return '/placeholder-image.jpg';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
}

// Student class and information interfaces
export interface StudentClass {
  subject: string;
  code: string;
  initials: string;
  teaching_group: string;
  teacher_id: number;
  teacher_name: string;
}

export interface StudentAttendance {
  present: number;
  absent: number;
  late: number;
  medical: number;
  early: number;
  today: string;
}

export interface StudentInformation {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  formal_picture: string;
  year_group: string;
  group_name: string;
  classes: StudentClass[];
  attendance: StudentAttendance;
}

export interface StudentInformationResponse {
  student: StudentInformation;
  success: boolean;
}

// Staff Classes API Types
export interface StaffClassStudent {
  id: number;
  name: string;
  last_name: string;
}

export interface StaffClass {
  subject_name: string;
  code: string;
  teaching_group: string;
  students: StaffClassStudent[];
}

export type StaffClassesResponse = StaffClass[]

 