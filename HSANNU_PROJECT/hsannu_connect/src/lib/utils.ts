import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert UTC time string to Shanghai time in HH:MM format
 * @param utcTimeString - Time string in format "HH:MM:SS" or ISO datetime string (assumed to be UTC)
 * @param dateString - Optional date string in format "YYYY-MM-DD" (defaults to today)
 * @returns Formatted time string in Shanghai timezone (HH:MM format)
 */
export function convertUTCToShanghaiTime(utcTimeString: string, dateString?: string): string {
  try {
    let utcDateTime: Date;
    
    // Check if it's a full ISO datetime string (contains 'T')
    if (utcTimeString.includes('T')) {
      // Handle ISO datetime strings like "0000-01-01T05:37:37Z"
      utcDateTime = new Date(utcTimeString);
    } else {
      // Handle simple time strings like "05:37:37"
      // Use provided date or default to today
      const date = dateString ? new Date(dateString + 'T00:00:00Z') : new Date()
      const dateStr = date.toISOString().split('T')[0] // Get YYYY-MM-DD format
      
      // Create a UTC datetime by combining date and time
      utcDateTime = new Date(dateStr + 'T' + utcTimeString + 'Z')
    }
    
    // Convert to Shanghai time (UTC+8) and format as HH:MM
    const shanghaiTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(utcDateTime)
    
    return shanghaiTime
  } catch (error) {
    console.error('Error converting time to Shanghai timezone:', error)
    // Fallback: try to extract time from string
    if (utcTimeString.includes('T')) {
      const timePart = utcTimeString.split('T')[1]?.split('Z')[0]?.substring(0, 5);
      return timePart || utcTimeString;
    }
    return utcTimeString
  }
}
