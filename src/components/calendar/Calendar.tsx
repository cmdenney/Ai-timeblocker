'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  description?: string
  location?: string
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
}

interface CalendarProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onAddEvent?: (date: Date) => void
}

export function Calendar({ events = [], onEventClick, onDateClick, onAddEvent }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateFormat = 'd'
  const rows = []

  let days = []
  let day = startDate

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayEvents = events.filter(event => 
        isSameDay(event.startTime, day)
      )
      
      days.push(
        <div
          key={day.toString()}
          className={`h-full p-2 border-r border-b border-gray-200 last:border-r-0 ${
            !isSameMonth(day, monthStart) ? 'bg-muted/30' : 'bg-background'
          } ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''} ${
            selectedDate && isSameDay(day, selectedDate) ? 'bg-primary/20' : ''
          } hover:bg-accent cursor-pointer group flex flex-col`}
          onClick={() => {
            setSelectedDate(day)
            onDateClick?.(day)
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${
              !isSameMonth(day, monthStart) ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {format(day, dateFormat)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onAddEvent?.(day)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 space-y-1 overflow-hidden">
            {dayEvents.slice(0, 4).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate cursor-pointer ${
                  event.category === 'work' ? 'bg-blue-100 text-blue-800' :
                  event.category === 'personal' ? 'bg-green-100 text-green-800' :
                  event.category === 'meeting' ? 'bg-purple-100 text-purple-800' :
                  event.category === 'break' ? 'bg-yellow-100 text-yellow-800' :
                  event.category === 'focus' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick?.(event)
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 4} more
              </div>
            )}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7 gap-0">
        {days}
      </div>
    )
    days = []
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-background">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Full Screen Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days - Full height */}
        <div className="flex-1 grid grid-rows-6">
          {rows}
        </div>
      </div>
    </div>
  )
}