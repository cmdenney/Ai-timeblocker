import { supabase } from '../client'
import { Database } from '../database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert']
type CalendarEventUpdate = Database['public']['Tables']['calendar_events']['Update']

export class EventService {
  // Get all events for a user
  static async getEvents(userId: string, options?: {
    startDate?: Date
    endDate?: Date
    category?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    if (options?.startDate) {
      query = query.gte('start_time', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('start_time', options.endDate.toISOString())
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data || []
  }

  // Get a single event by ID
  static async getEvent(eventId: string) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`)
    }

    return data
  }

  // Create a new event
  static async createEvent(event: Omit<CalendarEventInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...event,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }

    return data
  }

  // Update an existing event
  static async updateEvent(eventId: string, updates: Omit<CalendarEventUpdate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  }

  // Delete an event
  static async deleteEvent(eventId: string) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }

    return true
  }

  // Get events for a specific date range
  static async getEventsByDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.getEvents(userId, { startDate, endDate })
  }

  // Get events for today
  static async getTodayEvents(userId: string) {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    return this.getEvents(userId, { startDate: startOfDay, endDate: endOfDay })
  }

  // Get events for this week
  static async getWeekEvents(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    return this.getEvents(userId, { startDate: weekStart, endDate: weekEnd })
  }

  // Get events for this month
  static async getMonthEvents(userId: string, monthStart: Date) {
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)

    return this.getEvents(userId, { startDate: monthStart, endDate: monthEnd })
  }

  // Search events
  static async searchEvents(userId: string, searchQuery: string) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`Failed to search events: ${error.message}`)
    }

    return data || []
  }

  // Get events by category
  static async getEventsByCategory(userId: string, category: string) {
    return this.getEvents(userId, { category })
  }

  // Get recurring events
  static async getRecurringEvents(userId: string) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .not('recurrence_rule', 'is', null)
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch recurring events: ${error.message}`)
    }

    return data || []
  }

  // Get event statistics
  static async getEventStats(userId: string) {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    const [todayEvents, weekEvents, monthEvents, totalEvents] = await Promise.all([
      this.getEvents(userId, { startDate: startOfDay, endDate: endOfDay }),
      this.getEvents(userId, { startDate: weekStart, endDate: weekEnd }),
      this.getEvents(userId, { startDate: monthStart, endDate: monthEnd }),
      this.getEvents(userId)
    ])

    return {
      today: todayEvents.length,
      thisWeek: weekEvents.length,
      thisMonth: monthEvents.length,
      total: totalEvents.length
    }
  }

  // Bulk create events
  static async createEvents(events: Omit<CalendarEventInsert, 'id' | 'created_at' | 'updated_at'>[]) {
    const eventsWithTimestamps = events.map(event => ({
      ...event,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('calendar_events')
      .insert(eventsWithTimestamps)
      .select()

    if (error) {
      throw new Error(`Failed to create events: ${error.message}`)
    }

    return data || []
  }

  // Bulk update events
  static async updateEvents(updates: Array<{ id: string; updates: Omit<CalendarEventUpdate, 'id' | 'created_at'> }>) {
    const promises = updates.map(({ id, updates: eventUpdates }) =>
      this.updateEvent(id, eventUpdates)
    )

    const results = await Promise.allSettled(promises)
    
    const successful = results.filter(result => result.status === 'fulfilled')
    const failed = results.filter(result => result.status === 'rejected')

    return {
      successful: successful.length,
      failed: failed.length,
      results
    }
  }

  // Bulk delete events
  static async deleteEvents(eventIds: string[]) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .in('id', eventIds)

    if (error) {
      throw new Error(`Failed to delete events: ${error.message}`)
    }

    return true
  }
}
