'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  Calendar as CalendarIcon
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday, getDay } from 'date-fns'

// Types
export interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  description?: string
  location?: string
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
  color?: string
}

export interface GoogleStyleCalendarProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onAddEvent?: (date: Date) => void
  onMonthChange?: (date: Date) => void
  className?: string
  showNavigation?: boolean
  showTodayButton?: boolean
  maxEventsPerDay?: number
  loading?: boolean
}

// Event category colors
const EVENT_COLORS = {
  work: 'bg-blue-100 text-blue-800 border-blue-200',
  personal: 'bg-green-100 text-green-800 border-green-200',
  meeting: 'bg-purple-100 text-purple-800 border-purple-200',
  break: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  focus: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

// Main Calendar Component
export function GoogleStyleCalendar({
  events = [],
  onEventClick,
  onDateClick,
  onAddEvent,
  onMonthChange,
  className = '',
  showNavigation = true,
  showTodayButton = true,
  maxEventsPerDay = 4,
  loading = false
}: GoogleStyleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Calculate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Start on Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }, [startDate, endDate])

  const calendarDays = generateCalendarDays()

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    const newDate = subMonths(currentDate, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate)
  }, [currentDate, onMonthChange])

  const goToNextMonth = useCallback(() => {
    const newDate = addMonths(currentDate, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate)
  }, [currentDate, onMonthChange])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
    onMonthChange?.(today)
  }, [onMonthChange])

  // Event handlers
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }, [onDateClick])

  const handleAddEventClick = useCallback((date: Date, event: React.MouseEvent) => {
    event.stopPropagation()
    onAddEvent?.(date)
  }, [onAddEvent])

  const handleEventClick = useCallback((event: CalendarEvent, clickEvent: React.MouseEvent) => {
    clickEvent.stopPropagation()
    onEventClick?.(event)
  }, [onEventClick])

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date))
  }, [events])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!calendarRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          goToPreviousMonth()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNextMonth()
          break
        case 'Home':
          event.preventDefault()
          goToToday()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goToPreviousMonth, goToNextMonth, goToToday])

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={calendarRef}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      role="application"
      aria-label="Calendar"
    >
      {/* Header */}
      {showNavigation && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              {showTodayButton && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  aria-label="Go to today"
                >
                  Today
                </button>
              )}
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wide"
              role="columnheader"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isHovered = hoveredDate && isSameDay(day, hoveredDate)
            const dayEvents = getEventsForDate(day)
            const hasMoreEvents = dayEvents.length > maxEventsPerDay

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] p-2 border border-gray-100 rounded-lg cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                  ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                  ${isHovered ? 'bg-gray-50 shadow-sm' : ''}
                  hover:bg-gray-50 hover:shadow-sm
                  group relative
                `}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                role="gridcell"
                aria-label={`${format(day, 'MMMM d, yyyy')}${isTodayDate ? ', today' : ''}`}
                tabIndex={0}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-medium
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isTodayDate ? 'text-blue-600 font-semibold' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {/* Add event button */}
                  <button
                    onClick={(e) => handleAddEventClick(day, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all"
                    aria-label={`Add event on ${format(day, 'MMMM d, yyyy')}`}
                  >
                    <Plus className="h-3 w-3 text-gray-500" />
                  </button>
                </div>

                {/* Events */}
                <div className="space-y-1 flex-1">
                  {dayEvents.slice(0, maxEventsPerDay).map((event) => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 rounded border-l-2 truncate cursor-pointer transition-colors
                        ${EVENT_COLORS[event.category || 'other']}
                        hover:shadow-sm
                      `}
                      onClick={(e) => handleEventClick(event, e)}
                      title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Event: ${event.title}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  
                  {/* More events indicator */}
                  {hasMoreEvents && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - maxEventsPerDay} more
                    </div>
                  )}
                </div>

                {/* Today indicator */}
                {isTodayDate && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Error Boundary Component
export class CalendarErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Calendar Error
            </h3>
            <p className="text-gray-500 mb-4">
              Something went wrong loading the calendar. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Default export with error boundary
export default function GoogleStyleCalendarWithErrorBoundary(props: GoogleStyleCalendarProps) {
  return (
    <CalendarErrorBoundary>
      <GoogleStyleCalendar {...props} />
    </CalendarErrorBoundary>
  )
}
