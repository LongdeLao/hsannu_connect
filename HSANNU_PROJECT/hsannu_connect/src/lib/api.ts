// API utility functions for fetching data from the server
import { API_URL } from '../config';

const API_BASE_URL = `${API_URL}/api`;

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
 * Fetch all year groups with their basic information
 */
export async function fetchYearGroups(): Promise<YearGroup[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/year-groups`);
    if (!response.ok) {
      throw new Error(`Failed to fetch year groups: ${response.statusText}`);
    }
    
    const data: YearGroupsResponse = await response.json();
    if (!data.success) {
      throw new Error('Failed to fetch year groups from API');
    }
    
    return data.yearGroups;
  } catch (error) {
    console.error('Error fetching year groups:', error);
    throw error;
  }
}

/**
 * Fetch students for a specific year group
 */
export async function fetchStudentsByYearGroup(yearGroupId: string): Promise<StudentsByYearGroupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/students/${yearGroupId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch students for year group ${yearGroupId}: ${response.statusText}`);
    }
    
    const data: StudentsByYearGroupResponse = await response.json();
    if (!data.success) {
      throw new Error(`Failed to fetch students for year group ${yearGroupId}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching students for year group ${yearGroupId}:`, error);
    throw error;
  }
}

/**
 * Fetch students for a specific year (PIB, IB1, IB2)
 */
export async function fetchStudentsByYear(year: string): Promise<StudentsByYearResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/students-by-year/${year}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch students for year ${year}: ${response.statusText}`);
    }
    
    const data: StudentsByYearResponse = await response.json();
    if (!data.success) {
      throw new Error(`Failed to fetch students for year ${year}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching students for year ${year}:`, error);
    throw error;
  }
}

/**
 * Fetch all students for attendance (used for search and overview)
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
export interface Event {
  eventID: string;
  authorID: number;
  authorName: string;
  title: string;
  eventDescription: string;
  images: string[];
  address: string;
  eventDate: string; // ISO date string
  isWholeDay: boolean;
  startTime?: string; // ISO date string
  endTime?: string; // ISO date string
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
  try {
    const formData = new FormData();
    
    // Add event data to formData
    formData.append('eventID', crypto.randomUUID());
    formData.append('authorID', '1'); // TODO: Get from auth context
    formData.append('authorName', 'Current User'); // TODO: Get from auth context
    formData.append('title', eventData.title);
    formData.append('eventDescription', eventData.eventDescription);
    formData.append('address', eventData.address);
    formData.append('eventDate', eventData.eventDate.toISOString());
    formData.append('isWholeDay', eventData.isWholeDay.toString());
    
    // Add time fields if not a whole day event
    if (!eventData.isWholeDay && eventData.startTime && eventData.endTime) {
      formData.append('startTime', eventData.startTime.toISOString());
      formData.append('endTime', eventData.endTime.toISOString());
    }

    // Add images to formData
    if (eventData.images) {
      eventData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/post_event`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create event');
    }
    
    const responseData = await response.json();
    return { eventID: responseData.eventID };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(eventID: string, eventData: Partial<EventFormData>): Promise<void> {
  try {
    const formData = new FormData();
    
    formData.append('eventID', eventID);
    
    if (eventData.title) formData.append('title', eventData.title);
    if (eventData.eventDescription) formData.append('eventDescription', eventData.eventDescription);
    if (eventData.address) formData.append('address', eventData.address);
    if (eventData.eventDate) formData.append('eventDate', eventData.eventDate.toISOString());
    if (eventData.isWholeDay !== undefined) formData.append('isWholeDay', eventData.isWholeDay.toString());
    
    if (!eventData.isWholeDay && eventData.startTime && eventData.endTime) {
      formData.append('startTime', eventData.startTime.toISOString());
      formData.append('endTime', eventData.endTime.toISOString());
    }

    if (eventData.images) {
      eventData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/update_event`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update event');
    }
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
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

 