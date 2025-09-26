'use client'

import React, { useState, useMemo } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { CalendarEvent, EventDisplayConfig } from '@/types/events'
import { EventCard } from './EventCard'

interface EventListProps {
  events: CalendarEvent[]
  date: Date
  maxVisibleEvents?: number
  displayConfig?: EventDisplayConfig
  onEventClick?: (event: CalendarEvent) => void
  onEventEdit?: (event: CalendarEvent) => void
  onEventDelete?: (event: CalendarEvent) => void
  onEventDuplicate?: (event: CalendarEvent) => void
  onAddEvent?: (date: Date) => void
  className?: string
}

export function EventList({
  events,
  date,
  maxVisibleEvents = 4,
  displayConfig = {
    showTime: true,
    showLocation: false,
    showAttendees: false,
    maxTitleLength: 20,
    compactMode: false
  },
  onEventClick,
  onEventEdit,
  onEventDelete,
  onEventDuplicate,
  onAddEvent,
  className = ''
}: EventListProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)

  // Sort events by start time and priority
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      // First sort by priority (urgent first)
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Then sort by start time
      return a.startTime.getTime() - b.startTime.getTime()
    })
  }, [events])

  // Separate all-day and timed events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay = sortedEvents.filter(event => event.isAllDay)
    const timed = sortedEvents.filter(event => !event.isAllDay)
    return { allDayEvents: allDay, timedEvents: timed }
  }, [sortedEvents])

  // Get visible events based on maxVisibleEvents
  const visibleEvents = useMemo(() => {
    if (showAllEvents) return sortedEvents
    
    const allDayCount = allDayEvents.length
    const timedCount = Math.max(0, maxVisibleEvents - allDayCount)
    
    return [
      ...allDayEvents.slice(0, Math.min(allDayCount, maxVisibleEvents)),
      ...timedEvents.slice(0, timedCount)
    ]
  }, [sortedEvents, allDayEvents, timedEvents, maxVisibleEvents, showAllEvents])

  const hiddenEventsCount = sortedEvents.length - visibleEvents.length

  // Handle add event
  const handleAddEvent = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddEvent?.(date)
  }

  // Handle show more events
  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowAllEvents(true)
  }

  // Handle show less events
  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowAllEvents(false)
  }

  return (
    <div
      className={`space-y-1 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* All Day Events */}
      {allDayEvents.length > 0 && (
        <div className="space-y-1">
          {allDayEvents.slice(0, showAllEvents ? allDayEvents.length : Math.min(allDayEvents.length, maxVisibleEvents)).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              compact={displayConfig.compactMode}
              showTime={false}
              showLocation={displayConfig.showLocation}
              showAttendees={displayConfig.showAttendees}
              maxTitleLength={displayConfig.maxTitleLength}
              onEventClick={onEventClick}
              onEventEdit={onEventEdit}
              onEventDelete={onEventDelete}
              onEventDuplicate={onEventDuplicate}
              className="border-l-4"
            />
          ))}
        </div>
      )}

      {/* Timed Events */}
      {timedEvents.length > 0 && (
        <div className="space-y-1">
          {timedEvents.slice(0, showAllEvents ? timedEvents.length : Math.min(timedEvents.length, maxVisibleEvents - allDayEvents.length)).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              compact={displayConfig.compactMode}
              showTime={displayConfig.showTime}
              showLocation={displayConfig.showLocation}
              showAttendees={displayConfig.showAttendees}
              maxTitleLength={displayConfig.maxTitleLength}
              onEventClick={onEventClick}
              onEventEdit={onEventEdit}
              onEventDelete={onEventDelete}
              onEventDuplicate={onEventDuplicate}
            />
          ))}
        </div>
      )}

      {/* Show More/Less Button */}
      {hiddenEventsCount > 0 && !showAllEvents && (
        <button
          onClick={handleShowMore}
          className="w-full text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
          aria-label={`Show ${hiddenEventsCount} more events`}
        >
          +{hiddenEventsCount} more
        </button>
      )}

      {showAllEvents && sortedEvents.length > maxVisibleEvents && (
        <button
          onClick={handleShowLess}
          className="w-full text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
          aria-label="Show fewer events"
        >
          Show less
        </button>
      )}

      {/* Add Event Button */}
      {isHovered && onAddEvent && (
        <button
          onClick={handleAddEvent}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
          aria-label={`Add event on ${date.toLocaleDateString()}`}
        >
          <Plus className="h-3 w-3" />
          Add event
        </button>
      )}

      {/* Empty State */}
      {events.length === 0 && isHovered && onAddEvent && (
        <button
          onClick={handleAddEvent}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded px-2 py-2 transition-colors border border-dashed border-gray-300"
          aria-label={`Add event on ${date.toLocaleDateString()}`}
        >
          <Plus className="h-3 w-3" />
          Add event
        </button>
      )}
    </div>
  )
}

// Event Tooltip Component
interface EventTooltipProps {
  event: CalendarEvent
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function EventTooltip({ event, children, position = 'top' }: EventTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs
            ${getPositionClasses()}
          `}
        >
          <div className="font-semibold mb-1">{event.title}</div>
          {event.description && (
            <div className="text-gray-300 mb-2">{event.description}</div>
          )}
          {!event.isAllDay && (
            <div className="text-gray-300 mb-1">
              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {event.endTime && ` - ${event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          )}
          {event.location && (
            <div className="text-gray-300 mb-1">📍 {event.location}</div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="text-gray-300">
              👥 {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
