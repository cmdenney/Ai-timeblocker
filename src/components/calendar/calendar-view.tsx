'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calendarCellVariants, calendarEventVariants, calendarButtonVariants } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventCategory } from '@/types'

interface CalendarViewProps {
  events?: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView({ events = [], onDateSelect, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Add padding days to fill the calendar grid
  const startPadding = monthStart.getDay()
  const endPadding = 6 - monthEnd.getDay()
  const allDays = [
    ...Array.from({ length: startPadding }, (_, i) => subMonths(monthStart, 1).getDate() - startPadding + i + 1),
    ...daysInMonth.map(day => day.getDate()),
    ...Array.from({ length: endPadding }, (_, i) => i + 1)
  ]

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date))
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date)
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            className={cn(calendarButtonVariants({ variant: 'calendar', size: 'calendar' }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className={cn(calendarButtonVariants({ variant: 'calendar', size: 'calendar' }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Days of week header */}
          <div className="calendar-header">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="calendar-header-cell">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="calendar-responsive">
            {allDays.map((day, index) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const isCurrentMonth = index >= startPadding && index < startPadding + daysInMonth.length
              const isToday = isSameDay(date, new Date())
              const dayEvents = getEventsForDate(date)
              
              return (
                <div
                  key={index}
                  className={cn(
                    calendarCellVariants({
                      state: isToday ? 'today' : isCurrentMonth ? 'default' : 'disabled',
                      size: 'md'
                    }),
                    dayEvents.length > 0 && 'calendar-cell-event',
                    'cursor-pointer'
                  )}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                >
                  <div className="text-center font-medium">
                    {day}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="absolute inset-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={event.id}
                        className={cn(
                          calendarEventVariants({
                            category: event.category as EventCategory,
                            priority: event.priority,
                            size: 'sm'
                          })
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
