export type EventCategory = 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  category?: EventCategory
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  attendees?: string[]
  recurrence?: string
  status?: 'tentative' | 'confirmed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  metadata?: {
    parsedEvents?: ParsedEvent[]
    confidence?: number
    suggestions?: string[]
    conflicts?: Array<{
      type: string
      description: string
      severity: string
    }>
    tokens?: number
    cost?: number
  }
  replies?: ChatMessage[]
}

export interface ParsedEvent {
  title: string
  startDate: Date
  endDate: Date
  isAllDay: boolean
  recurrence?: string
  location?: string
  description?: string
  confidence: number
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  timezone?: string
  workingHours?: {
    start: number
    end: number
  }
  preferences?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
  messageCount: number
  userId: string
  metadata?: {
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
    category?: string
    summary?: string
  }
}

export interface MessageThread {
  id: string
  sessionId: string
  parentId?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  isCollapsed: boolean
  metadata?: {
    title?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
  }
}