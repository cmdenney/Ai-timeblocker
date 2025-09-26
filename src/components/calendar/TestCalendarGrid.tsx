'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  isToday
} from 'date-fns'
import { Plus } from 'lucide-react'
import { CalendarEvent } from '@/types/events'

interface TestCalendarGridProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onAddEvent?: (date: Date) => void
  className?: string
}

export function TestCalendarGrid({
  events = [],
  onEventClick,
  onDateClick,
  onAddEvent,
  className = ''
}: TestCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const handleAddEvent = (date: Date) => {
    onAddEvent?.(date)
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date))
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid with inline styles to test CSS grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px'
          }}
        >
          {weekDays.map((day) => (
            <div
              key={day}
              style={{
                padding: '12px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}
        >
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const dayEvents = getEventsForDate(day)

            return (
              <div
                key={day.toISOString()}
                style={{
                  minHeight: '100px',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isCurrentMonth ? '#ffffff' : '#f9fafb',
                  ...(isTodayDate && {
                    backgroundColor: '#eff6ff',
                    borderColor: '#93c5fd'
                  }),
                  ...(isSelected && {
                    backgroundColor: '#dbeafe',
                    borderColor: '#60a5fa'
                  })
                }}
                onClick={() => handleDateClick(day)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isCurrentMonth ? '#ffffff' : '#f9fafb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                role="gridcell"
                aria-label={`${format(day, 'MMMM d, yyyy')}${isTodayDate ? ', today' : ''}`}
                tabIndex={0}
              >
                {/* Date number */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: isCurrentMonth ? '#111827' : '#9ca3af',
                      ...(isTodayDate && {
                        color: '#2563eb',
                        fontWeight: '600'
                      })
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {/* Add event button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddEvent(day)
                    }}
                    style={{
                      opacity: 0,
                      padding: '4px',
                      borderRadius: '50%',
                      transition: 'all 0.2s',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.backgroundColor = '#e5e7eb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    aria-label={`Add event on ${format(day, 'MMMM d, yyyy')}`}
                  >
                    <Plus size={12} color="#6b7280" />
                  </button>
                </div>

                {/* Events */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        fontSize: '12px',
                        padding: '4px',
                        borderRadius: '4px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#bfdbfe'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#dbeafe'
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>

                {/* Today indicator */}
                {isTodayDate && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#2563eb',
                    borderRadius: '50%'
                  }}></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
