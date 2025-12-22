import {
  IconDashboard,
  IconCalendar,
  IconCalendarEvent,
  IconClipboardList,
  IconSchool,
  IconUserCheck,
  IconDatabase,
  IconReport,
  IconFileWord,
  IconSettings,
  IconHelp,
  IconSearch,
  IconUsers,
  IconBookmark,
  type Icon,
} from "@tabler/icons-react";

export type NavItem = {
  title: string;
  url: string;
  icon: Icon;
};

export const navMain: NavItem[] = [
  { title: "Dashboard", url: "/student/dashboard", icon: IconDashboard },
  { title: "Timetable", url: "/student/dashboard", icon: IconCalendar },
  { title: "Events", url: "/student/dashboard", icon: IconCalendarEvent },
  { title: "Surveys", url: "/student/surveys", icon: IconClipboardList },
  { title: "Classes", url: "/student/classes", icon: IconSchool },
  { title: "Attendance", url: "/student/dashboard", icon: IconUserCheck },
];

export const documents: { name: string; url: string; icon: Icon }[] = [
  { name: "Data Library", url: "/student/dashboard", icon: IconDatabase },
  { name: "Reports", url: "/student/dashboard", icon: IconReport },
  { name: "Word Assistant", url: "/student/dashboard", icon: IconFileWord },
];

export const navSecondary: NavItem[] = [
  { title: "PIB", url: "/shared/attendance/pib", icon: IconUsers },
  { title: "IB1", url: "/shared/attendance/ib1", icon: IconSchool },
  { title: "IB2", url: "/shared/attendance/ib2", icon: IconBookmark },
];

export const userDefault = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}; 