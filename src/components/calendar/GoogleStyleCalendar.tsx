'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday, 
  getDay,
  isWeekend
} from 'date-fns'
import { CalendarEvent } from '@/types/events'
import { EventList } from '@/components/events/EventList'
import { EventModal } from '@/components/events/EventModal'
import { useEventManagement } from '@/hooks/useEventManagement'
import { CalendarHeader, CalendarView } from './CalendarHeader'

export interface GoogleStyleCalendarProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onAddEvent?: (date: Date) => void
  onMonthChange?: (date: Date) => void
  onSearch?: (query: string) => void
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  className?: string
  showNavigation?: boolean
  showTodayButton?: boolean
  maxEventsPerDay?: number
  loading?: boolean
  showHeader?: boolean
}

// Fixed Calendar Grid Component
export function GoogleStyleCalendar({
  events = [],
  onEventClick,
  onDateClick,
  onAddEvent,
  onMonthChange,
  onSearch,
  user,
  className = '',
  showNavigation = true,
  showTodayButton = true,
  maxEventsPerDay = 4,
  loading = false,
  showHeader = true
}: GoogleStyleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [currentView, setCurrentView] = useState<CalendarView>('month')
  const calendarRef = useRef<HTMLDivElement>(null)
  
  // Use event management hook
  const {
    events: managedEvents,
    isModalOpen,
    modalMode,
    selectedEvent,
    getEventsForDate,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    handleEventClick,
    handleEventEdit,
    handleEventDelete,
    handleEventDuplicate,
    handleEventSave
  } = useEventManagement(events)

  // Calculate calendar grid with proper date logic
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Start on Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Generate calendar days array (42 days total for 6 weeks)
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

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Enhanced event handlers
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }, [onDateClick])

  const handleAddEventClick = useCallback((date: Date) => {
    openCreateModal(date)
  }, [openCreateModal])

  const handleEventClickInternal = useCallback((event: CalendarEvent) => {
    handleEventClick(event)
  }, [handleEventClick])

  // Header handlers
  const handleHeaderDateChange = useCallback((date: Date) => {
    setCurrentDate(date)
    onMonthChange?.(date)
  }, [onMonthChange])

  const handleHeaderCreateEvent = useCallback((date?: Date) => {
    openCreateModal(date || currentDate)
  }, [openCreateModal, currentDate])

  const handleHeaderSearch = useCallback((query: string) => {
    onSearch?.(query)
  }, [onSearch])

  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view)
    // TODO: Implement view switching logic
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!calendarRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          const prevMonth = subMonths(currentDate, 1)
          setCurrentDate(prevMonth)
          onMonthChange?.(prevMonth)
          break
        case 'ArrowRight':
          event.preventDefault()
          const nextMonth = addMonths(currentDate, 1)
          setCurrentDate(nextMonth)
          onMonthChange?.(nextMonth)
          break
        case 'Home':
          event.preventDefault()
          const today = new Date()
          setCurrentDate(today)
          setSelectedDate(today)
          onMonthChange?.(today)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentDate, onMonthChange])

  return (
    <div
      ref={calendarRef}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
        ${className}
      `}
      role="application"
      aria-label="Calendar"
    >
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Loading calendar...</span>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      {showHeader && (
        <CalendarHeader
          currentDate={currentDate}
          onDateChange={handleHeaderDateChange}
          onViewChange={handleViewChange}
          onCreateEvent={handleHeaderCreateEvent}
          onSearch={handleHeaderSearch}
          user={user}
        />
      )}

      {/* Calendar Grid Container - FIXED VERSION */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Week day headers - Force 7 columns on all screen sizes */}
        <div 
          className="border-b border-gray-200 bg-gray-50"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)'
          }}
        >
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wide border-r border-gray-200 last:border-r-0"
              role="columnheader"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid - Force 7 columns with inline styles to override responsive CSS */}
        <div 
          className="flex-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)'
          }}
        >
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isHovered = hoveredDate && isSameDay(day, hoveredDate)
            const isWeekendDay = isWeekend(day)
            const dayEvents = getEventsForDate(day)

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[100px] p-2 border-r border-b border-gray-200 cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}
                  ${isSelected ? 'bg-blue-100 border-blue-400' : ''}
                  ${isHovered ? 'bg-gray-50 shadow-sm' : ''}
                  hover:bg-gray-50 hover:shadow-sm
                  group relative
                  ${isWeekendDay ? 'bg-gray-25' : ''}
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
                      ${isTodayDate ? 'text-blue-600 font-semibold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                      ${isWeekendDay && isCurrentMonth ? 'text-gray-600' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {/* Add event button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddEventClick(day)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all"
                    aria-label={`Add event on ${format(day, 'MMMM d, yyyy')}`}
                  >
                    <Plus className="h-3 w-3 text-gray-500" />
                  </button>
                </div>

                {/* Events using EventList component */}
                <div className="flex-1 min-h-0">
                  <EventList
                    events={dayEvents}
                    date={day}
                    maxVisibleEvents={maxEventsPerDay}
                    displayConfig={{
                      showTime: true,
                      showLocation: false,
                      showAttendees: false,
                      maxTitleLength: 20,
                      compactMode: true
                    }}
                    onEventClick={handleEventClickInternal}
                    onEventEdit={handleEventEdit}
                    onEventDelete={handleEventDelete}
                    onEventDuplicate={handleEventDuplicate}
                    onAddEvent={handleAddEventClick}
                  />
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
      
      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        onDuplicate={handleEventDuplicate}
        defaultDate={selectedDate || new Date()}
        mode={modalMode}
      />
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

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Calendar Error
            </h3>
            <p className="text-gray-600 mb-4">
              Something went wrong loading the calendar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Calendar
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}