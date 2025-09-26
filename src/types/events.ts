// Enhanced Event Types and Interfaces
export type EventCategory = 'work' | 'personal' | 'important' | 'meeting' | 'focus' | 'break' | 'travel' | 'other'

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent'

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  category: EventCategory
  priority: EventPriority
  status: EventStatus
  location?: string
  attendees?: string[]
  color?: string
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
  }
  reminders?: {
    minutes: number[]
    method: 'popup' | 'email' | 'sms'
  }[]
  metadata?: Record<string, any>
}

// Event display configuration
export interface EventDisplayConfig {
  showTime: boolean
  showLocation: boolean
  showAttendees: boolean
  maxTitleLength: number
  compactMode: boolean
}

// Event interaction handlers
export interface EventHandlers {
  onEventClick: (event: CalendarEvent) => void
  onEventEdit: (event: CalendarEvent) => void
  onEventDelete: (event: CalendarEvent) => void
  onEventMove: (event: CalendarEvent, newStartTime: Date, newEndTime: Date) => void
  onEventResize: (event: CalendarEvent, newEndTime: Date) => void
}

// Event category colors (Google Calendar inspired)
export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  work: 'bg-blue-100 text-blue-800 border-l-blue-500',
  personal: 'bg-green-100 text-green-800 border-l-green-500',
  important: 'bg-red-100 text-red-800 border-l-red-500',
  meeting: 'bg-purple-100 text-purple-800 border-l-purple-500',
  focus: 'bg-orange-100 text-orange-800 border-l-orange-500',
  break: 'bg-yellow-100 text-yellow-800 border-l-yellow-500',
  travel: 'bg-indigo-100 text-indigo-800 border-l-indigo-500',
  other: 'bg-gray-100 text-gray-800 border-l-gray-500',
}

// Priority indicators
export const PRIORITY_INDICATORS: Record<EventPriority, string> = {
  low: '',
  medium: 'border-l-2',
  high: 'border-l-4',
  urgent: 'border-l-4 border-l-red-600',
}

// Status indicators
export const STATUS_INDICATORS: Record<EventStatus, string> = {
  confirmed: '',
  tentative: 'opacity-75 italic',
  cancelled: 'line-through opacity-50',
}
