import {
  IconCalendar,
  IconCalendarEvent,
  IconClipboardList,
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUserCheck,
  IconMessageCircle,
  IconClipboardCheck,
  IconClock,
  IconBook,
  IconChalkboard,
  IconSchool,
  type Icon,
} from "@tabler/icons-react"
import { fetchYearGroups, type YearGroup } from './api'

export interface NavigationItem {
  title: string
  url?: string
  icon?: Icon
  items?: {
    title: string
    url: string
  }[]
}

export interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

export interface UserRole {
  role: string
  name: string
  email: string
  avatar: string
}

// Student navigation items
export const studentNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/shared/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Chats",
    url: "/shared/chat",
    icon: IconMessageCircle,
  },
  {
    title: "Events",
    url: "/shared/events",
    icon: IconCalendarEvent,
  },
  {
    title: "Timetable",
    url: "/student/timetable",
    icon: IconClock,
  },
  {
    title: "Surveys",
    url: "/shared/surveys",
    icon: IconClipboardList,
  },
  {
    title: "Classes",
    url: "/student/classes",
    icon: IconChalkboard,
  },
  {
    title: "Attendance",
    url: "/student/attendance",
    icon: IconUserCheck,
  },
]

// Function to generate dynamic attendance navigation items
async function generateAttendanceNavigation(): Promise<NavigationItem[]> {
  try {
    const yearGroups = await fetchYearGroups();
    
    // Group by year (PIB, IB1, IB2)
    const yearMap = new Map<string, YearGroup[]>();
    yearGroups.forEach(group => {
      if (!yearMap.has(group.year)) {
        yearMap.set(group.year, []);
      }
      yearMap.get(group.year)!.push(group);
    });

    // Generate navigation items for each year
    const attendanceItems: NavigationItem[] = [];
    
    // Sort years (PIB first, then IB1, IB2)
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => {
      const order = { 'PIB': 1, 'IB1': 2, 'IB2': 3 };
      return (order[a as keyof typeof order] || 999) - (order[b as keyof typeof order] || 999);
    });

    sortedYears.forEach(year => {
      const groups = yearMap.get(year)!;
      
      if (groups.length === 1) {
        // Single group, direct link
        attendanceItems.push({
          title: year,
          url: `/staff/attendance/${groups[0].id}`,
        });
      } else {
        // Multiple groups, create submenu
        attendanceItems.push({
          title: year,
          url: `/staff/attendance/${year.toLowerCase()}`,
          items: groups.map(group => ({
            title: `${year} ${group.section}`,
            url: `/staff/attendance/${group.id}`,
          })),
        });
      }
    });

    return attendanceItems;
  } catch (error) {
    console.error('Failed to fetch year groups for navigation:', error);
    // Fallback to static navigation
    return [
      {
        title: "PIB",
        url: "/staff/attendance/pib",
      },
      {
        title: "IB1", 
        url: "/staff/attendance/ib1",
      },
      {
        title: "IB2",
        url: "/staff/attendance/ib2",
      },
    ];
  }
}

// Static staff navigation items (without attendance)
const baseStaffNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/shared/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Chats",
    url: "/shared/chat",
    icon: IconMessageCircle,
  },
  {
    title: "Events",
    url: "/shared/events",
    icon: IconCalendarEvent,
  },
  {
    title: "Timetable",
    url: "/staff/timetable",
    icon: IconClock,
  },
  {
    title: "Surveys",
    url: "/shared/surveys",
    icon: IconClipboardList,
  },
  {
    title: "Classes",
    url: "/staff/classes",
    icon: IconChalkboard,
  },
]

// Function to generate complete staff navigation with dynamic attendance
export async function getStaffNavigation(): Promise<NavigationItem[]> {
  const attendanceItems = await generateAttendanceNavigation();
  
  return [
    ...baseStaffNavigation,
    {
      title: "Attendance",
      icon: IconUserCheck,
      items: attendanceItems.map(item => ({
        title: item.title,
        url: item.url || `/staff/attendance/${item.title.toLowerCase()}`,
      })),
    },
  ];
}

// Static staff navigation (fallback)
export const staffNavigation: NavigationItem[] = [
  ...baseStaffNavigation,
  {
    title: "Attendance",
    icon: IconUserCheck,
    items: [
      {
        title: "PIB",
        url: "/staff/attendance/pib",
      },
      {
        title: "IB1",
        url: "/staff/attendance/ib1",
      },
      {
        title: "IB2",
        url: "/staff/attendance/ib2",
      },
    ],
  },
]

// Shared documents section
export const documentsNavigation: NavigationItem[] = [
  {
    title: "Documents",
    url: "/shared/documents",
    icon: IconFolder,
  },
  {
    title: "Data Library",
    url: "/shared/data-library",
    icon: IconDatabase,
  },
  {
    title: "Word Assistant",
    url: "/shared/word-assistant",
    icon: IconFileWord,
  },
]

// Shared secondary navigation
export const secondaryNavigation: NavigationItem[] = [
  {
    title: "Settings",
    url: "/shared/settings",
    icon: IconSettings,
  },
  {
    title: "Get Help",
    url: "/shared/help",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "/shared/search",
    icon: IconSearch,
  },
]

// Staff-specific secondary navigation
export const staffSecondaryNavigation: NavigationItem[] = [
  {
    title: "PIB",
    url: "/staff/pib",
    icon: IconBook,
  },
  {
    title: "IB1",
    url: "/staff/ib1",
    icon: IconBook,
  },
  {
    title: "IB2",
    url: "/staff/ib2",
    icon: IconBook,
  },
]

// Function to get navigation based on user role (async version)
export async function getNavigationForRoleAsync(userRole: string): Promise<{
  main: NavigationItem[]
  documents: NavigationItem[]
  secondary: NavigationItem[]
}> {
  let mainNav: NavigationItem[] = []
  const secondaryNav: NavigationItem[] = secondaryNavigation
  
  switch (userRole.toLowerCase()) {
    case 'student':
      mainNav = studentNavigation
      break
    case 'staff':
    case 'teacher':
    case 'admin':
      try {
        mainNav = await getStaffNavigation()
      } catch (error) {
        console.error('Failed to get dynamic staff navigation, using fallback:', error)
        mainNav = staffNavigation
      }
      break
    default:
      mainNav = studentNavigation // Default to student navigation
  }

  return {
    main: mainNav,
    documents: documentsNavigation,
    secondary: secondaryNav,
  }
}

// Function to get navigation based on user role (sync version - fallback)
export function getNavigationForRole(userRole: string): {
  main: NavigationItem[]
  documents: NavigationItem[]
  secondary: NavigationItem[]
} {
  let mainNav: NavigationItem[] = []
  const secondaryNav: NavigationItem[] = secondaryNavigation
  
  switch (userRole.toLowerCase()) {
    case 'student':
      mainNav = studentNavigation
      break
    case 'staff':
    case 'teacher':
    case 'admin':
      mainNav = staffNavigation
      break
    default:
      mainNav = studentNavigation // Default to student navigation
  }

  return {
    main: mainNav,
    documents: documentsNavigation,
    secondary: secondaryNav,
  }
}

// Function to get user role from localStorage (for client-side)
export function getCurrentUserRole(): string {
  if (typeof window === 'undefined') return 'student' // Default for SSR
  
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      return user.role || 'student'
    }
  } catch (error) {
    console.error('Error getting user role:', error)
  }
  
  return 'student' // Default fallback
}

// Function to get full user data from localStorage
export function getCurrentUser(): UserRole | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      return {
        role: user.role || 'student',
        name: user.name || 'User',
        email: user.email || 'user@hsannu.com',
        avatar: '/avatars/default.jpg',
      }
    }
  } catch (error) {
    console.error('Error getting user data:', error)
  }
  
  return null
} 
 