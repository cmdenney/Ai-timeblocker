import { supabase } from '../client'
import { Database } from '../database.types'

type User = Database['public']['Tables']['users']['Row']

export class CalendarService {
  // Sync events from Google Calendar via API
  static async syncGoogleEvents(userId: string): Promise<any[]> {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to sync Google events')
      }

      const data = await response.json()
      return data.events || []
    } catch (error) {
      console.error('Error syncing Google events:', error)
      throw error
    }
  }

  // Create event in Google Calendar via API
  static async createGoogleEvent(userId: string, event: any): Promise<any> {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, event })
      })

      if (!response.ok) {
        throw new Error('Failed to create Google event')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating Google event:', error)
      throw error
    }
  }

  // Update event in Google Calendar via API
  static async updateGoogleEvent(userId: string, eventId: string, updates: any): Promise<any> {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update Google event')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating Google event:', error)
      throw error
    }
  }

  // Delete event from Google Calendar via API
  static async deleteGoogleEvent(userId: string, eventId: string): Promise<void> {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to delete Google event')
      }
    } catch (error) {
      console.error('Error deleting Google event:', error)
      throw error
    }
  }

  // Check if user has Google Calendar connected
  static async isGoogleCalendarConnected(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('google_access_token, google_calendar_enabled')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return false
      }

      return !!(user.google_access_token && user.google_calendar_enabled)
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error)
      return false
    }
  }

  // Refresh Google access token via API
  static async refreshGoogleToken(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/calendar/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.success || false
    } catch (error) {
      console.error('Error refreshing Google token:', error)
      return false
    }
  }

  // Get user's calendar events from database
  static async getUserEvents(userId: string, startDate?: Date, endDate?: Date) {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true })

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('end_time', endDate.toISOString())
      }

      const { data: events, error } = await query

      if (error) {
        throw error
      }

      return events || []
    } catch (error) {
      console.error('Error getting user events:', error)
      throw error
    }
  }

  // Save event to database
  static async saveEvent(userId: string, event: {
    title: string
    description?: string
    start_time: Date
    end_time: Date
    location?: string
    category?: string
    google_event_id?: string
  }) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: event.title,
          description: event.description,
          start_time: event.start_time.toISOString(),
          end_time: event.end_time.toISOString(),
          location: event.location,
          category: event.category,
          google_event_id: event.google_event_id,
          is_all_day: false
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error saving event:', error)
      throw error
    }
  }

  // Update event in database
  static async updateEvent(eventId: string, updates: Partial<{
    title: string
    description: string
    start_time: Date
    end_time: Date
    location: string
    category: string
  }>) {
    try {
      const updateData: any = {}
      
      if (updates.title) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.start_time) updateData.start_time = updates.start_time.toISOString()
      if (updates.end_time) updateData.end_time = updates.end_time.toISOString()
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.category !== undefined) updateData.category = updates.category

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  // Delete event from database
  static async deleteEvent(eventId: string) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }
}
