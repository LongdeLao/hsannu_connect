import { BookOpen, Atom, Calculator, TestTube, Globe, Palette, Music, Dumbbell, Users, FileText, BookOpenCheck, GraduationCap, Trophy, Calendar, ClipboardList, UserCheck, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Subject detection patterns
const SUBJECT_PATTERNS = {
  physics: {
    keywords: ['physics', 'mechanics', 'thermodynamics', 'electricity', 'magnetism', 'optics', 'quantum', 'relativity', 'waves'],
    icon: Atom,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  chemistry: {
    keywords: ['chemistry', 'organic', 'inorganic', 'biochemistry', 'molecular', 'chemical', 'reaction', 'compound', 'element'],
    icon: TestTube,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  mathematics: {
    keywords: ['mathematics', 'math', 'calculus', 'algebra', 'geometry', 'statistics', 'analysis', 'approaches', 'interpretation'],
    icon: Calculator,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  biology: {
    keywords: ['biology', 'biological', 'life', 'genetics', 'ecology', 'evolution', 'anatomy', 'physiology', 'botany', 'zoology'],
    icon: BookOpenCheck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  english: {
    keywords: ['english', 'literature', 'language', 'writing', 'grammar', 'composition', 'poetry', 'prose'],
    icon: BookOpen,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  history: {
    keywords: ['history', 'historical', 'ancient', 'modern', 'civilization', 'culture', 'society', 'war', 'politics'],
    icon: Globe,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  art: {
    keywords: ['art', 'visual', 'design', 'painting', 'sculpture', 'drawing', 'creative', 'aesthetic'],
    icon: Palette,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  music: {
    keywords: ['music', 'musical', 'theory', 'composition', 'performance', 'instrument', 'harmony', 'rhythm'],
    icon: Music,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  sports: {
    keywords: ['sports', 'physical', 'education', 'fitness', 'exercise', 'athletics', 'health', 'pe'],
    icon: Dumbbell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  psychology: {
    keywords: ['psychology', 'psychological', 'behavior', 'cognitive', 'social', 'mental', 'mind'],
    icon: Users,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
  tok: {
    keywords: ['theory of knowledge', 'tok', 'epistemology', 'knowledge', 'truth', 'belief', 'justification'],
    icon: GraduationCap,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200'
  }
};

// Document type detection patterns
const TYPE_PATTERNS = {
  syllabus: {
    keywords: ['syllabus', 'curriculum', 'course', 'outline', 'program', 'guide'],
    icon: ClipboardList,
    priority: 10
  },
  assignment: {
    keywords: ['assignment', 'homework', 'task', 'exercise', 'worksheet', 'problem'],
    icon: FileText,
    priority: 8
  },
  exam: {
    keywords: ['exam', 'test', 'quiz', 'assessment', 'evaluation', 'paper'],
    icon: Trophy,
    priority: 9
  },
  schedule: {
    keywords: ['schedule', 'timetable', 'calendar', 'agenda', 'plan'],
    icon: Calendar,
    priority: 7
  },
  attendance: {
    keywords: ['attendance', 'register', 'roll', 'present', 'absent'],
    icon: UserCheck,
    priority: 6
  },
  report: {
    keywords: ['report', 'summary', 'analysis', 'review', 'evaluation'],
    icon: Briefcase,
    priority: 5
  }
};

export interface ParsedDocument {
  subject?: keyof typeof SUBJECT_PATTERNS;
  type?: keyof typeof TYPE_PATTERNS;
  confidence: number;
  subjectIcon?: LucideIcon;
  subjectColor?: string;
  subjectBgColor?: string;
  subjectBorderColor?: string;
  typeIcon?: LucideIcon;
}

/**
 * Parse document filename and description to detect subject and type
 */
export function parseDocument(fileName: string, description?: string): ParsedDocument {
  const text = `${fileName} ${description || ''}`.toLowerCase();
  
  // Detect subject
  let bestSubject: keyof typeof SUBJECT_PATTERNS | undefined;
  let bestSubjectScore = 0;
  
  for (const [subject, config] of Object.entries(SUBJECT_PATTERNS)) {
    const score = config.keywords.reduce((acc, keyword) => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      return acc + matches;
    }, 0);
    
    if (score > bestSubjectScore) {
      bestSubjectScore = score;
      bestSubject = subject as keyof typeof SUBJECT_PATTERNS;
    }
  }
  
  // Detect document type
  let bestType: keyof typeof TYPE_PATTERNS | undefined;
  let bestTypeScore = 0;
  
  for (const [type, config] of Object.entries(TYPE_PATTERNS)) {
    const score = config.keywords.reduce((acc, keyword) => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      return acc + matches * config.priority;
    }, 0);
    
    if (score > bestTypeScore) {
      bestTypeScore = score;
      bestType = type as keyof typeof TYPE_PATTERNS;
    }
  }
  
  const result: ParsedDocument = {
    confidence: Math.max(bestSubjectScore, bestTypeScore) / 10
  };
  
  if (bestSubject && bestSubjectScore > 0) {
    const subjectConfig = SUBJECT_PATTERNS[bestSubject];
    result.subject = bestSubject;
    result.subjectIcon = subjectConfig.icon;
    result.subjectColor = subjectConfig.color;
    result.subjectBgColor = subjectConfig.bgColor;
    result.subjectBorderColor = subjectConfig.borderColor;
  }
  
  if (bestType && bestTypeScore > 0) {
    const typeConfig = TYPE_PATTERNS[bestType];
    result.type = bestType;
    result.typeIcon = typeConfig.icon;
  }
  
  return result;
}

/**
 * Get a fallback icon for unknown document types
 */
export function getFallbackIcon() {
  return FileText;
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to readable format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
} 
 