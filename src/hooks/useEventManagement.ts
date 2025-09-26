'use client'

import { useState, useCallback, useMemo } from 'react'
import { CalendarEvent, EventCategory, EventPriority, EventStatus } from '@/types/events'
import { addDays, isSameDay, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

// Event management hook
export function useEventManagement(initialEvents: CalendarEvent[] = []) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')

  // Create new event
  const createEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    setEvents(prev => [...prev, newEvent])
    return newEvent
  }, [])

  // Update existing event
  const updateEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ))
  }, [])

  // Delete event
  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }, [])

  // Duplicate event
  const duplicateEvent = useCallback((event: CalendarEvent) => {
    const duplicatedEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${event.title} (Copy)`,
      startTime: addDays(event.startTime, 1),
      endTime: addDays(event.endTime, 1)
    }
    
    setEvents(prev => [...prev, duplicatedEvent])
    return duplicatedEvent
  }, [])

  // Move event to new time
  const moveEvent = useCallback((eventId: string, newStartTime: Date, newEndTime: Date) => {
    const duration = newEndTime.getTime() - newStartTime.getTime()
    const originalDuration = events.find(e => e.id === eventId)?.endTime.getTime()! - events.find(e => e.id === eventId)?.startTime.getTime()!
    
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            startTime: newStartTime,
            endTime: new Date(newStartTime.getTime() + originalDuration)
          }
        : event
    ))
  }, [events])

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      if (event.isAllDay) {
        return isSameDay(event.startTime, date)
      }
      
      const eventStart = startOfDay(event.startTime)
      const eventEnd = endOfDay(event.endTime)
      const targetDate = startOfDay(date)
      
      return isWithinInterval(targetDate, { start: eventStart, end: eventEnd })
    })
  }, [events])

  // Get events for a date range
  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date) => {
    return events.filter(event => {
      const eventStart = startOfDay(event.startTime)
      const eventEnd = endOfDay(event.endTime)
      const rangeStart = startOfDay(startDate)
      const rangeEnd = endOfDay(endDate)
      
      return (
        (eventStart >= rangeStart && eventStart <= rangeEnd) ||
        (eventEnd >= rangeStart && eventEnd <= rangeEnd) ||
        (eventStart <= rangeStart && eventEnd >= rangeEnd)
      )
    })
  }, [events])

  // Get events by category
  const getEventsByCategory = useCallback((category: EventCategory) => {
    return events.filter(event => event.category === category)
  }, [events])

  // Get events by priority
  const getEventsByPriority = useCallback((priority: EventPriority) => {
    return events.filter(event => event.priority === priority)
  }, [events])

  // Get upcoming events
  const getUpcomingEvents = useCallback((limit: number = 10) => {
    const now = new Date()
    return events
      .filter(event => event.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, limit)
  }, [events])

  // Get overdue events
  const getOverdueEvents = useCallback(() => {
    const now = new Date()
    return events.filter(event => event.endTime < now && event.status !== 'cancelled')
  }, [events])

  // Modal handlers
  const openCreateModal = useCallback((defaultDate?: Date) => {
    setSelectedEvent(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setModalMode('edit')
    setIsModalOpen(true)
  }, [])

  const openViewModal = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setModalMode('view')
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }, [])

  // Event handlers for components
  const handleEventClick = useCallback((event: CalendarEvent) => {
    openViewModal(event)
  }, [openViewModal])

  const handleEventEdit = useCallback((event: CalendarEvent) => {
    openEditModal(event)
  }, [openEditModal])

  const handleEventDelete = useCallback((event: CalendarEvent) => {
    deleteEvent(event.id)
  }, [deleteEvent])

  const handleEventDuplicate = useCallback((event: CalendarEvent) => {
    duplicateEvent(event)
  }, [duplicateEvent])

  const handleEventSave = useCallback((eventData: CalendarEvent) => {
    if (modalMode === 'create') {
      createEvent(eventData)
    } else if (modalMode === 'edit') {
      updateEvent(eventData.id, eventData)
    }
  }, [modalMode, createEvent, updateEvent])

  // Statistics
  const eventStats = useMemo(() => {
    const total = events.length
    const byCategory = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    }, {} as Record<EventCategory, number>)
    
    const byPriority = events.reduce((acc, event) => {
      acc[event.priority] = (acc[event.priority] || 0) + 1
      return acc
    }, {} as Record<EventPriority, number>)
    
    const upcoming = getUpcomingEvents().length
    const overdue = getOverdueEvents().length
    
    return {
      total,
      byCategory,
      byPriority,
      upcoming,
      overdue
    }
  }, [events, getUpcomingEvents, getOverdueEvents])

  return {
    // State
    events,
    selectedEvent,
    isModalOpen,
    modalMode,
    
    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    moveEvent,
    
    // Queries
    getEventsForDate,
    getEventsForDateRange,
    getEventsByCategory,
    getEventsByPriority,
    getUpcomingEvents,
    getOverdueEvents,
    
    // Modal handlers
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    
    // Event handlers
    handleEventClick,
    handleEventEdit,
    handleEventDelete,
    handleEventDuplicate,
    handleEventSave,
    
    // Statistics
    eventStats
  }
}

// Multi-day event utilities
export function getMultiDayEventSegments(event: CalendarEvent, startDate: Date, endDate: Date) {
  const segments = []
  const eventStart = startOfDay(event.startTime)
  const eventEnd = endOfDay(event.endTime)
  const rangeStart = startOfDay(startDate)
  const rangeEnd = endOfDay(endDate)
  
  // Calculate the intersection
  const segmentStart = eventStart > rangeStart ? eventStart : rangeStart
  const segmentEnd = eventEnd < rangeEnd ? eventEnd : rangeEnd
  
  if (segmentStart <= segmentEnd) {
    segments.push({
      event,
      startDate: segmentStart,
      endDate: segmentEnd,
      isFirstDay: isSameDay(segmentStart, eventStart),
      isLastDay: isSameDay(segmentEnd, eventEnd)
    })
  }
  
  return segments
}

// Event conflict detection
export function detectEventConflicts(events: CalendarEvent[], newEvent: CalendarEvent): CalendarEvent[] {
  return events.filter(event => {
    if (event.id === newEvent.id) return false
    
    const eventStart = event.startTime.getTime()
    const eventEnd = event.endTime.getTime()
    const newStart = newEvent.startTime.getTime()
    const newEnd = newEvent.endTime.getTime()
    
    // Check for overlap
    return (newStart < eventEnd && newEnd > eventStart)
  })
}

// Event suggestions based on patterns
export function suggestEventTimes(events: CalendarEvent[], date: Date, duration: number = 60) {
  const dayEvents = events.filter(event => isSameDay(event.startTime, date))
  const suggestions = []
  
  // Default working hours (9 AM to 5 PM)
  const workingHours = [
    { start: 9, end: 12 },   // Morning
    { start: 13, end: 17 }   // Afternoon
  ]
  
  workingHours.forEach(block => {
    const blockStart = new Date(date)
    blockStart.setHours(block.start, 0, 0, 0)
    
    const blockEnd = new Date(date)
    blockEnd.setHours(block.end, 0, 0, 0)
    
    // Find available slots
    let currentTime = blockStart
    
    while (currentTime.getTime() + duration * 60000 <= blockEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000)
      
      // Check if this slot conflicts with existing events
      const hasConflict = dayEvents.some(event => {
        const eventStart = event.startTime.getTime()
        const eventEnd = event.endTime.getTime()
        return (currentTime.getTime() < eventEnd && slotEnd.getTime() > eventStart)
      })
      
      if (!hasConflict) {
        suggestions.push({
          startTime: new Date(currentTime),
          endTime: slotEnd,
          duration
        })
      }
      
      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60000)
    }
  })
  
  return suggestions.slice(0, 5) // Return top 5 suggestions
}
