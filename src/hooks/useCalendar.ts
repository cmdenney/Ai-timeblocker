import { useState, useCallback, useMemo } from 'react'
import { addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  color?: string
  isAllDay: boolean
  location?: string
  description?: string
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  attendees?: string[]
  recurrence?: {
    rule: string
    pattern: string
  }
}

export interface CalendarState {
  currentDate: Date
  selectedDate: Date | null
  view: CalendarView
  events: CalendarEvent[]
  isLoading: boolean
  error: string | null
}

export interface CalendarActions {
  setCurrentDate: (date: Date) => void
  setSelectedDate: (date: Date | null) => void
  setView: (view: CalendarView) => void
  navigateDate: (direction: 'prev' | 'next') => void
  goToToday: () => void
  goToDate: (date: Date) => void
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (eventId: string) => void
  setEvents: (events: CalendarEvent[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export interface UseCalendarOptions {
  initialDate?: Date
  initialView?: CalendarView
  initialEvents?: CalendarEvent[]
  onEventChange?: (event: CalendarEvent, action: 'create' | 'update' | 'delete') => void
  onDateChange?: (date: Date) => void
  onViewChange?: (view: CalendarView) => void
}

export function useCalendar(options: UseCalendarOptions = {}): CalendarState & CalendarActions {
  const {
    initialDate = new Date(),
    initialView = 'month',
    initialEvents = [],
    onEventChange,
    onDateChange,
    onViewChange
  } = options

  const [currentDate, setCurrentDate] = useState(initialDate)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<CalendarView>(initialView)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Navigation functions
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      let newDate: Date
      
      switch (view) {
        case 'month':
          newDate = direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1)
          break
        case 'week':
          newDate = direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1)
          break
        case 'day':
          newDate = direction === 'next' ? addDays(prev, 1) : addDays(prev, -1)
          break
        default:
          newDate = prev
      }
      
      onDateChange?.(newDate)
      return newDate
    })
  }, [view, onDateChange])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    onDateChange?.(today)
  }, [onDateChange])

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date)
    onDateChange?.(date)
  }, [onDateChange])

  // Event management functions
  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    setEvents(prev => [...prev, newEvent])
    onEventChange?.(newEvent, 'create')
  }, [onEventChange])

  const updateEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => {
      const updatedEvents = prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      )
      
      const updatedEvent = updatedEvents.find(event => event.id === eventId)
      if (updatedEvent) {
        onEventChange?.(updatedEvent, 'update')
      }
      
      return updatedEvents
    })
  }, [onEventChange])

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => {
      const eventToDelete = prev.find(event => event.id === eventId)
      if (eventToDelete) {
        onEventChange?.(eventToDelete, 'delete')
      }
      
      return prev.filter(event => event.id !== eventId)
    })
  }, [onEventChange])

  // View change handler
  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView)
    onViewChange?.(newView)
  }, [onViewChange])

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    switch (view) {
      case 'month':
        return generateMonthDays(currentDate)
      case 'week':
        return generateWeekDays(currentDate)
      case 'day':
        return [currentDate]
      default:
        return generateMonthDays(currentDate)
    }
  }, [currentDate, view])

  // Filter events for current view
  const visibleEvents = useMemo(() => {
    const startDate = calendarDays[0]
    const endDate = calendarDays[calendarDays.length - 1]

    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate >= startDate && eventDate <= endDate
    })
  }, [events, calendarDays])

  // Event statistics
  const eventStats = useMemo(() => {
    const today = new Date()
    const todayEvents = events.filter(event => 
      event.startTime.toDateString() === today.toDateString()
    )
    
    const thisWeekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime)
      const weekStart = startOfWeek(today)
      const weekEnd = endOfWeek(today)
      return eventDate >= weekStart && eventDate <= weekEnd
    })
    
    const thisMonthEvents = events.filter(event => {
      const eventDate = new Date(event.startTime)
      const monthStart = startOfMonth(today)
      const monthEnd = endOfMonth(today)
      return eventDate >= monthStart && eventDate <= monthEnd
    })

    return {
      today: todayEvents.length,
      thisWeek: thisWeekEvents.length,
      thisMonth: thisMonthEvents.length,
      total: events.length
    }
  }, [events])

  return {
    // State
    currentDate,
    selectedDate,
    view,
    events,
    isLoading,
    error,
    
    // Actions
    setCurrentDate,
    setSelectedDate,
    setView: handleViewChange,
    navigateDate,
    goToToday,
    goToDate,
    addEvent,
    updateEvent,
    deleteEvent,
    setEvents,
    setLoading: setIsLoading,
    setError
  }
}

// Utility functions
function generateMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date))
  const end = endOfWeek(endOfMonth(date))
  const days = []

  let current = start
  while (current <= end) {
    days.push(new Date(current))
    current = addDays(current, 1)
  }

  return days
}

function generateWeekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  const days = []

  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i))
  }

  return days
}

// Event filtering utilities
export function filterEventsByCategory(events: CalendarEvent[], category: string): CalendarEvent[] {
  if (category === 'all') return events
  return events.filter(event => event.category === category)
}

export function filterEventsByDateRange(events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEvent[] {
  return events.filter(event => {
    const eventDate = new Date(event.startTime)
    return eventDate >= startDate && eventDate <= endDate
  })
}

export function searchEvents(events: CalendarEvent[], query: string): CalendarEvent[] {
  if (!query.trim()) return events
  
  const lowercaseQuery = query.toLowerCase()
  return events.filter(event => 
    event.title.toLowerCase().includes(lowercaseQuery) ||
    event.location?.toLowerCase().includes(lowercaseQuery) ||
    event.description?.toLowerCase().includes(lowercaseQuery)
  )
}

// Event sorting utilities
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

export function sortEventsByPriority(events: CalendarEvent[]): CalendarEvent[] {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
  return [...events].sort((a, b) => 
    (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2)
  )
}

// Event conflict detection
export function detectEventConflicts(events: CalendarEvent[]): Array<{
  event1: CalendarEvent
  event2: CalendarEvent
  type: 'overlap' | 'same_time' | 'travel_time'
  severity: 'low' | 'medium' | 'high'
}> {
  const conflicts = []
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i]
      const event2 = events[j]
      
      // Check for time overlap
      if (event1.startTime < event2.endTime && event2.startTime < event1.endTime) {
        const overlapMinutes = Math.min(
          (event2.endTime.getTime() - event1.startTime.getTime()) / (1000 * 60),
          (event1.endTime.getTime() - event2.startTime.getTime()) / (1000 * 60)
        )
        
        let severity: 'low' | 'medium' | 'high' = 'low'
        if (overlapMinutes > 60) severity = 'high'
        else if (overlapMinutes > 30) severity = 'medium'
        
        conflicts.push({
          event1,
          event2,
          type: 'overlap',
          severity
        })
      }
      
      // Check for same time
      if (event1.startTime.getTime() === event2.startTime.getTime()) {
        conflicts.push({
          event1,
          event2,
          type: 'same_time',
          severity: 'high'
        })
      }
      
      // Check for travel time conflicts
      if (event1.location && event2.location && event1.location !== event2.location) {
        const timeBetween = (event2.startTime.getTime() - event1.endTime.getTime()) / (1000 * 60)
        if (timeBetween > 0 && timeBetween < 15) { // Less than 15 minutes between events
          conflicts.push({
            event1,
            event2,
            type: 'travel_time',
            severity: 'medium'
          })
        }
      }
    }
  }
  
  return conflicts
}
