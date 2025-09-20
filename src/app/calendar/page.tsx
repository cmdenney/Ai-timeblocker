import { Suspense } from 'react'
import { Calendar } from '@/components/calendar/Calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { EventService } from '@/lib/supabase/services/events'
import { AuthService } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'

function CalendarSkeleton() {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        <div className="grid grid-rows-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-32" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function CalendarContent() {
  // Check authentication
  const user = await AuthService.getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's events
  const events = await EventService.getEvents(user.id)
  
  // Transform events to match Calendar component interface
  const transformedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    startTime: new Date(event.start_time),
    endTime: new Date(event.end_time),
    color: event.color || undefined,
    isAllDay: event.is_all_day,
    location: event.location || undefined,
    description: event.description || undefined,
    category: event.category as 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other',
    priority: event.priority as 'low' | 'medium' | 'high' | 'urgent',
    attendees: event.attendees as string[] | undefined,
    recurrence: event.recurrence_rule ? {
      rule: event.recurrence_rule,
      pattern: event.recurrence_pattern || ''
    } : undefined
  }))

  const handleEventCreate = async (event: any) => {
    'use server'
    
    try {
      await EventService.createEvent({
        user_id: user.id,
        title: event.title,
        description: event.description || null,
        start_time: event.startTime.toISOString(),
        end_time: event.endTime.toISOString(),
        is_all_day: event.isAllDay || false,
        location: event.location || null,
        category: event.category || 'other',
        priority: event.priority || 'medium',
        color: event.color || null,
        recurrence_rule: event.recurrence?.rule || null,
        recurrence_pattern: event.recurrence?.pattern || null,
        attendees: event.attendees || null,
        metadata: null
      })
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleEventUpdate = async (eventId: string, updates: any) => {
    'use server'
    
    try {
      await EventService.updateEvent(eventId, {
        title: updates.title,
        description: updates.description,
        start_time: updates.startTime?.toISOString(),
        end_time: updates.endTime?.toISOString(),
        is_all_day: updates.isAllDay,
        location: updates.location,
        category: updates.category,
        priority: updates.priority,
        color: updates.color,
        recurrence_rule: updates.recurrence?.rule,
        recurrence_pattern: updates.recurrence?.pattern,
        attendees: updates.attendees,
        metadata: updates.metadata
      })
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const handleEventDelete = async (eventId: string) => {
    'use server'
    
    try {
      await EventService.deleteEvent(eventId)
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date)
  }

  return (
    <Calendar
      events={transformedEvents}
      onEventCreate={handleEventCreate}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      onDateSelect={handleDateSelect}
      timezone={user.profile?.timezone || 'UTC'}
      workingHours={(user.profile?.working_hours as { start: number; end: number }) || { start: 9, end: 17 }}
      showWeekends={true}
      enableDragDrop={true}
      enableKeyboardShortcuts={true}
    />
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarContent />
    </Suspense>
  )
}