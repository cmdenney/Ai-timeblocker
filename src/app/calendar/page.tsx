'use client'

import { useState } from 'react'
import { Calendar } from '@/components/calendar/Calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      startTime: new Date(2024, 11, 15, 10, 0),
      endTime: new Date(2024, 11, 15, 11, 0),
      isAllDay: false,
      category: 'meeting',
      description: 'Weekly team standup',
      location: 'Conference Room A'
    },
    {
      id: '2',
      title: 'Focus Time',
      startTime: new Date(2024, 11, 16, 14, 0),
      endTime: new Date(2024, 11, 16, 16, 0),
      isAllDay: false,
      category: 'focus',
      description: 'Deep work session'
    },
    {
      id: '3',
      title: 'Lunch Break',
      startTime: new Date(2024, 11, 17, 12, 0),
      endTime: new Date(2024, 11, 17, 13, 0),
      isAllDay: false,
      category: 'break'
    }
  ])

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event)
    // TODO: Open event details modal
  }

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    // TODO: Open add event modal for this date
  }

  const handleAddEvent = (date: Date) => {
    console.log('Add event for date:', date)
    // TODO: Open add event modal
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Calendar
            </h1>
            <p className="text-muted-foreground">
              Manage your schedule and time blocks
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Calendar */}
        <Calendar
          events={events}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onAddEvent={handleAddEvent}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(event => {
                  const now = new Date()
                  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
                  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6))
                  return event.startTime >= weekStart && event.startTime <= weekEnd
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(event => event.category === 'focus').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}