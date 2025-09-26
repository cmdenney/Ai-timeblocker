'use client'

import React, { useState, useRef } from 'react'
import { 
  Clock, 
  MapPin, 
  Users, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Copy,
  AlertCircle
} from 'lucide-react'
import { format, isPast, isToday, isFuture } from 'date-fns'
import { CalendarEvent, EventCategory, EventPriority, EventStatus, EVENT_CATEGORY_COLORS, PRIORITY_INDICATORS, STATUS_INDICATORS } from '@/types/events'

interface EventCardProps {
  event: CalendarEvent
  compact?: boolean
  showTime?: boolean
  showLocation?: boolean
  showAttendees?: boolean
  maxTitleLength?: number
  onEventClick?: (event: CalendarEvent) => void
  onEventEdit?: (event: CalendarEvent) => void
  onEventDelete?: (event: CalendarEvent) => void
  onEventDuplicate?: (event: CalendarEvent) => void
  className?: string
}

export function EventCard({
  event,
  compact = false,
  showTime = true,
  showLocation = false,
  showAttendees = false,
  maxTitleLength = 20,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onEventDuplicate,
  className = ''
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Determine if event is past, present, or future
  const isEventPast = isPast(event.endTime)
  const isEventToday = isToday(event.startTime)
  const isEventFuture = isFuture(event.startTime)

  // Format time display
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  // Truncate title if too long
  const truncateTitle = (title: string, maxLength: number) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength - 3) + '...'
  }

  // Get event status styling
  const getEventStatusStyle = () => {
    let baseStyle = EVENT_CATEGORY_COLORS[event.category]
    
    // Add priority styling
    baseStyle += ` ${PRIORITY_INDICATORS[event.priority]}`
    
    // Add status styling
    baseStyle += ` ${STATUS_INDICATORS[event.status]}`
    
    // Add time-based styling
    if (isEventPast && !isEventToday) {
      baseStyle += ' opacity-60'
    }
    
    return baseStyle
  }

  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEventClick?.(event)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEventEdit?.(event)
    setShowActions(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEventDelete?.(event)
    setShowActions(false)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEventDuplicate?.(event)
    setShowActions(false)
  }

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEventClick?.(event)
    }
  }

  return (
    <div
      ref={cardRef}
      className={`
        relative group cursor-pointer transition-all duration-200
        ${getEventStatusStyle()}
        ${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2'}
        ${isHovered ? 'shadow-md transform scale-105' : 'shadow-sm'}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Event: ${event.title}${event.isAllDay ? ', All day' : `, ${formatTime(event.startTime)}`}`}
    >
      {/* Event Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Event Title */}
          <div className="font-medium truncate">
            {truncateTitle(event.title, maxTitleLength)}
          </div>
          
          {/* Event Time */}
          {showTime && !event.isAllDay && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">
                {formatTime(event.startTime)}
                {event.endTime && !isSameDay(event.startTime, event.endTime) && 
                  ` - ${formatTime(event.endTime)}`
                }
              </span>
            </div>
          )}
          
          {/* All Day Indicator */}
          {event.isAllDay && (
            <div className="text-xs mt-1 font-medium">
              All Day
            </div>
          )}
          
          {/* Location */}
          {showLocation && event.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="text-xs truncate">
                {event.location}
              </span>
            </div>
          )}
          
          {/* Attendees */}
          {showAttendees && event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">
                {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        {/* Priority Indicator */}
        {event.priority === 'urgent' && (
          <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
        )}
      </div>
      
      {/* Action Menu */}
      {isHovered && (onEventEdit || onEventDelete || onEventDuplicate) && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            aria-label="Event actions"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
              {onEventEdit && (
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
              )}
              {onEventDuplicate && (
                <button
                  onClick={handleDuplicate}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Duplicate
                </button>
              )}
              {onEventDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Multi-day indicator */}
      {event.startTime && event.endTime && !isSameDay(event.startTime, event.endTime) && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-current rounded-full opacity-50"></div>
      )}
    </div>
  )
}

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}
