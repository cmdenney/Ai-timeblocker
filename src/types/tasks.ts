// Enhanced Task Management Types with Eisenhower Matrix Classification

export type EisenhowerQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type EnergyLevel = 'low' | 'medium' | 'high'
export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'social' | 'maintenance' | 'creative' | 'other'

export interface Task {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number // minutes
  eisenhowerQuadrant: EisenhowerQuadrant
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  isCompleted: boolean
  userId: string
  aiGenerated: boolean
  energyLevel: EnergyLevel
  tags: string[]
  estimatedDuration?: number
  actualDuration?: number
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  parentTaskId?: string
  subtasks?: Task[]
  dependencies?: string[]
  location?: string
  notes?: string
  aiConfidence?: number // 0-1 for AI classification confidence
  originalText?: string // Original brain dump text that generated this task
}

export interface TimeBlock {
  id: string
  date: Date
  startTime: string // "09:00"
  endTime: string // "10:30"
  task?: Task
  isAvailable: boolean
  isWorkingHours: boolean
  energyLevel: EnergyLevel
  blockType: 'task' | 'break' | 'buffer' | 'focus' | 'meeting' | 'unavailable'
}

export interface CalendarView {
  type: 'month' | 'week' | 'day'
  date: Date
  startDate: Date
  endDate: Date
}

export interface UserPreferences {
  workingHours: {
    start: string // "09:00"
    end: string // "17:00"
  }
  workingDays: number[] // [1,2,3,4,5] for Mon-Fri
  timezone: string
  energyPeakHours: {
    high: string[] // ["09:00", "10:00", "11:00"]
    medium: string[]
    low: string[]
  }
  defaultTaskDuration: number // minutes
  bufferTime: number // minutes between tasks
  breakFrequency: number // minutes
  breakDuration: number // minutes
  focusBlockDuration: number // minutes
  aiSchedulingEnabled: boolean
  eisenhowerAutoClassification: boolean
}

// Eisenhower Matrix Quadrant Definitions
export const EISENHOWER_QUADRANTS = {
  Q1: {
    name: 'Do First',
    description: 'Urgent + Important',
    color: 'bg-orange-200/60 border-orange-400 text-orange-800',
    darkColor: 'dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-200',
    priority: 4,
    icon: '🔥'
  },
  Q2: {
    name: 'Schedule',
    description: 'Not Urgent + Important',
    color: 'bg-blue-200/60 border-blue-400 text-blue-800',
    darkColor: 'dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-200',
    priority: 3,
    icon: '📅'
  },
  Q3: {
    name: 'Delegate',
    description: 'Urgent + Not Important',
    color: 'bg-purple-200/60 border-purple-400 text-purple-800',
    darkColor: 'dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-200',
    priority: 2,
    icon: '👥'
  },
  Q4: {
    name: 'Eliminate',
    description: 'Not Urgent + Not Important',
    color: 'bg-red-200/60 border-red-400 text-red-800',
    darkColor: 'dark:bg-red-900/30 dark:border-red-600 dark:text-red-200',
    priority: 1,
    icon: '🗑️'
  }
} as const

// Task Category Colors
export const TASK_CATEGORY_COLORS = {
  work: 'bg-blue-100/80 border-blue-300 text-blue-900',
  personal: 'bg-green-100/80 border-green-300 text-green-900',
  health: 'bg-pink-100/80 border-pink-300 text-pink-900',
  learning: 'bg-indigo-100/80 border-indigo-300 text-indigo-900',
  social: 'bg-yellow-100/80 border-yellow-300 text-yellow-900',
  maintenance: 'bg-gray-100/80 border-gray-300 text-gray-900',
  creative: 'bg-purple-100/80 border-purple-300 text-purple-900',
  other: 'bg-slate-100/80 border-slate-300 text-slate-900'
} as const

// Energy Level Indicators
export const ENERGY_LEVEL_COLORS = {
  high: 'bg-green-50 border-green-200',
  medium: 'bg-yellow-50 border-yellow-200',
  low: 'bg-red-50 border-red-200'
} as const

// Task Status Colors
export const TASK_STATUS_COLORS = {
  pending: 'bg-gray-100 border-gray-300 text-gray-700',
  in_progress: 'bg-blue-100 border-blue-300 text-blue-700',
  completed: 'bg-green-100 border-green-300 text-green-700',
  cancelled: 'bg-red-100 border-red-300 text-red-700',
  blocked: 'bg-orange-100 border-orange-300 text-orange-700'
} as const

// Time slot configuration
export const TIME_SLOT_CONFIG = {
  startHour: 6, // 6 AM
  endHour: 23, // 11 PM
  slotDuration: 15, // 15 minutes
  hoursPerDay: 17,
  slotsPerHour: 4,
  totalSlots: 68 // (23-6) * 4
} as const

// AI Classification Prompts
export const AI_CLASSIFICATION_PROMPTS = {
  eisenhower: `Classify this task using the Eisenhower Matrix:
- Q1 (Do First): Urgent AND Important - crises, emergencies, deadline-driven projects
- Q2 (Schedule): Not Urgent BUT Important - prevention, planning, development, relationship building
- Q3 (Delegate): Urgent BUT Not Important - interruptions, some calls/emails, some meetings
- Q4 (Eliminate): Not Urgent AND Not Important - time wasters, pleasant activities, some social media

Task: "{task}"
Context: "{context}"

Respond with just the quadrant (Q1, Q2, Q3, or Q4) and confidence (0-1).`,
  
  energyLevel: `Determine the energy level required for this task:
- High: Complex problem-solving, creative work, important decisions, learning new skills
- Medium: Routine work, meetings, administrative tasks, planning
- Low: Simple tasks, organizing, responding to emails, light maintenance

Task: "{task}"
Description: "{description}"

Respond with just the energy level (high, medium, or low) and confidence (0-1).`,
  
  duration: `Estimate the duration for this task in minutes:
Consider complexity, typical time for similar tasks, and any mentioned constraints.

Task: "{task}"
Description: "{description}"
Context: "{context}"

Respond with just the number of minutes.`
} as const
