'use client'

import React, { useCallback } from 'react'
import { format, isSameMonth, isSameDay, isToday, isWeekend, addDays } from 'date-fns'
import { Plus } from 'lucide-react'
import { CalendarEvent } from '@/types/events'
import { EventList } from '@/components/events/EventList'

interface CalendarGridProps {
  calendarDays: Date[]
  monthStart: Date
  selectedDate: Date | null
  hoveredDate: Date | null
  dayEvents: (date: Date) => CalendarEvent[]
  maxEventsPerDay: number
  onDateClick: (date: Date) => void
  onAddEvent: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onEventEdit: (event: CalendarEvent) => void
  onEventDelete: (event: CalendarEvent) => void
  onEventDuplicate: (event: CalendarEvent) => void
  setHoveredDate: (date: Date | null) => void
}

export function CalendarGrid({
  calendarDays,
  monthStart,
  selectedDate,
  hoveredDate,
  dayEvents,
  maxEventsPerDay,
  onDateClick,
  onAddEvent,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onEventDuplicate,
  setHoveredDate
}: CalendarGridProps) {
  
  // Render individual calendar cell
  const renderCalendarCell = useCallback((day: Date, index: number) => {
    const isCurrentMonth = isSameMonth(day, monthStart)
    const isTodayDate = isToday(day)
    const isSelected = selectedDate && isSameDay(day, selectedDate)
    const isHovered = hoveredDate && isSameDay(day, hoveredDate)
    const isWeekendDay = isWeekend(day)
    const events = dayEvents(day)

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
        onClick={() => onDateClick(day)}
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
              onAddEvent(day)
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
            events={events}
            date={day}
            maxVisibleEvents={maxEventsPerDay}
            displayConfig={{
              showTime: true,
              showLocation: false,
              showAttendees: false,
              maxTitleLength: 20,
              compactMode: true
            }}
            onEventClick={onEventClick}
            onEventEdit={onEventEdit}
            onEventDelete={onEventDelete}
            onEventDuplicate={onEventDuplicate}
            onAddEvent={onAddEvent}
          />
        </div>

        {/* Today indicator */}
        {isTodayDate && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
        )}
      </div>
    )
  }, [
    monthStart,
    selectedDate,
    hoveredDate,
    dayEvents,
    maxEventsPerDay,
    onDateClick,
    onAddEvent,
    onEventClick,
    onEventEdit,
    onEventDelete,
    onEventDuplicate,
    setHoveredDate
  ])

  return (
    <div className="flex-1 grid grid-cols-7 grid-rows-6">
      {calendarDays.map((day, index) => renderCalendarCell(day, index))}
    </div>
  )
}

// Week day headers component
export function WeekDayHeaders() {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
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
  )
}
