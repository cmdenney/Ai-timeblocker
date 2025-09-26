'use client'

import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/supabase/auth'
import { CalendarService } from '@/lib/supabase/services/calendar'
import { useRouter } from 'next/navigation'
import { TestCalendarGrid } from '@/components/calendar/TestCalendarGrid'
import { CalendarEvent } from '@/types/events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar as CalendarIcon, RefreshCw, CheckCircle } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'

// CalendarEvent interface is now imported from GoogleStyleCalendar

export default function CalendarPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser()
        setCurrentUser(user)
        setIsAuthenticated(!!user)
        
        if (!user) {
          router.push('/auth/signin')
          return
        }

        // Check if Google Calendar is connected
        const isConnected = await CalendarService.isGoogleCalendarConnected(user.id)
        setIsGoogleConnected(isConnected)

        // Load events
        await loadEvents(user.id)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const loadEvents = async (userId: string) => {
    try {
      const userEvents = await CalendarService.getUserEvents(userId)
      setEvents(userEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        isAllDay: event.is_all_day || false,
        category: (event.category as any) || 'other',
        priority: 'medium',
        status: 'confirmed',
        location: event.location || '',
        attendees: [],
        color: '',
        reminders: [],
        metadata: {}
      })))
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }

  const syncWithGoogle = async () => {
    if (!currentUser) return

    try {
      setIsSyncing(true)
      setSyncMessage('Syncing with Google Calendar...')
      
      const googleEvents = await CalendarService.syncGoogleEvents(currentUser.id)
      
      // Convert Google events to our format and save them
      for (const event of googleEvents) {
        await CalendarService.saveEvent(currentUser.id, {
          title: event.title,
          description: event.description,
          start_time: event.startTime,
          end_time: event.endTime,
          location: event.location,
          category: 'google',
          google_event_id: event.id
        })
      }

      // Reload events
      await loadEvents(currentUser.id)
      
      setSyncMessage(`Successfully synced ${googleEvents.length} events from Google Calendar!`)
      setTimeout(() => setSyncMessage(null), 3000)
    } catch (error) {
      console.error('Failed to sync with Google:', error)
      setSyncMessage('Failed to sync with Google Calendar. Please try again.')
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setIsSyncing(false)
    }
  }

  // Enhanced sample events for demonstration
  const sampleEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Meeting',
      description: 'Weekly team sync and project updates',
      startTime: new Date(2024, 11, 15, 10, 0), // December 15, 2024, 10:00 AM
      endTime: new Date(2024, 11, 15, 11, 0),
      isAllDay: false,
      category: 'meeting',
      priority: 'high',
      status: 'confirmed',
      location: 'Conference Room A',
      attendees: ['john@company.com', 'jane@company.com']
    },
    {
      id: '2',
      title: 'Focus Time',
      description: 'Deep work session for project development',
      startTime: new Date(2024, 11, 16, 9, 0), // December 16, 2024, 9:00 AM
      endTime: new Date(2024, 11, 16, 12, 0),
      isAllDay: false,
      category: 'focus',
      priority: 'medium',
      status: 'confirmed',
      location: 'Home Office'
    },
    {
      id: '3',
      title: 'Lunch Break',
      description: 'Lunch with colleagues',
      startTime: new Date(2024, 11, 17, 12, 0), // December 17, 2024, 12:00 PM
      endTime: new Date(2024, 11, 17, 13, 0),
      isAllDay: false,
      category: 'break',
      priority: 'low',
      status: 'confirmed',
      location: 'Downtown Restaurant'
    },
    {
      id: '4',
      title: 'Project Review',
      description: 'Quarterly project review and planning',
      startTime: new Date(2024, 11, 18, 14, 0), // December 18, 2024, 2:00 PM
      endTime: new Date(2024, 11, 18, 15, 30),
      isAllDay: false,
      category: 'work',
      priority: 'urgent',
      status: 'confirmed',
      location: 'Boardroom',
      attendees: ['manager@company.com', 'team@company.com']
    },
    {
      id: '5',
      title: 'Personal Time',
      description: 'Gym workout and personal time',
      startTime: new Date(2024, 11, 19, 17, 0), // December 19, 2024, 5:00 PM
      endTime: new Date(2024, 11, 19, 18, 0),
      isAllDay: false,
      category: 'personal',
      priority: 'low',
      status: 'confirmed',
      location: 'Fitness Center'
    },
    {
      id: '6',
      title: 'All Day Conference',
      description: 'Annual tech conference',
      startTime: new Date(2024, 11, 20, 0, 0), // December 20, 2024
      endTime: new Date(2024, 11, 20, 23, 59),
      isAllDay: true,
      category: 'important',
      priority: 'high',
      status: 'confirmed',
      location: 'Convention Center'
    }
  ]

  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents)

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event)
    // TODO: Open event details modal
    alert(`Event: ${event.title}\nTime: ${event.startTime.toLocaleTimeString()} - ${event.endTime.toLocaleTimeString()}\nDescription: ${event.description || 'No description'}`)
  }

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    // TODO: Open add event modal for this date
    alert(`Add event for ${date.toLocaleDateString()}`)
  }

  const handleAddEvent = (date: Date) => {
    console.log('Add event for date:', date)
    // TODO: Open add event modal
    alert(`Add event for ${date.toLocaleDateString()}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Access Denied. Please sign in.</div>
      </div>
    )
  }

  return (
    <MainLayout user={currentUser}>
      <div className="h-full flex flex-col">
        {/* Top Controls - Compact */}
        <div className="px-4 py-2 border-b border-gray-200 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar
              </h1>
              {isGoogleConnected && (
                <Button 
                  onClick={syncWithGoogle} 
                  disabled={isSyncing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`mr-2 h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Google'}
                </Button>
              )}
            </div>
            <Button onClick={() => handleAddEvent(new Date())} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>

          {/* Status Messages - Compact */}
          {!isGoogleConnected && (
            <div className="mt-2 text-xs text-muted-foreground">
              Google Calendar is not connected. Sign in with Google to sync your calendar.
            </div>
          )}
          {syncMessage && (
            <div className="mt-2 text-xs text-green-600">
              {syncMessage}
            </div>
          )}
        </div>

        {/* Full Screen Google-Style Calendar */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-4">
            <TestCalendarGrid
              events={events}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onAddEvent={handleAddEvent}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}