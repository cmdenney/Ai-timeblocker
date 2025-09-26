'use client'

import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/supabase/auth'
import { CalendarService } from '@/lib/supabase/services/calendar'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/calendar/Calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar as CalendarIcon, RefreshCw, CheckCircle } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'

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
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        isAllDay: event.is_all_day || false,
        description: event.description,
        location: event.location,
        category: event.category as any
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

  const [events, setEvents] = useState<CalendarEvent[]>([])

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
        {/* Top Controls */}
        <div className="p-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your schedule and time blocks
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleConnected && (
                <Button 
                  onClick={syncWithGoogle} 
                  disabled={isSyncing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Google'}
                </Button>
              )}
              <Button onClick={() => handleAddEvent(new Date())} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>

          {/* Google Calendar Status */}
          {isGoogleConnected ? (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Google Calendar is connected! Your events will sync automatically.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                Google Calendar is not connected. Sign in with Google to sync your calendar.
              </AlertDescription>
            </Alert>
          )}

          {/* Sync Message */}
          {syncMessage && (
            <Alert className="mt-4">
              <AlertDescription>{syncMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Full Screen Calendar */}
        <div className="flex-1 p-4">
          <Calendar
            events={events}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onAddEvent={handleAddEvent}
          />
        </div>
      </div>
    </MainLayout>
  )
}