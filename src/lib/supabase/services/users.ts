import { supabase } from '../client'
import { Database } from '../database.types'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export class UserService {
  // Get user by ID
  static async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    return data
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      throw new Error(`Failed to fetch user by email: ${error.message}`)
    }

    return data
  }

  // Create a new user
  static async createUser(user: Omit<UserInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return data
  }

  // Update user
  static async updateUser(userId: string, updates: Omit<UserUpdate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return data
  }

  // Delete user
  static async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return true
  }

  // Update user preferences
  static async updateUserPreferences(userId: string, preferences: any) {
    return this.updateUser(userId, { preferences })
  }

  // Update user timezone
  static async updateUserTimezone(userId: string, timezone: string) {
    return this.updateUser(userId, { timezone })
  }

  // Update user working hours
  static async updateUserWorkingHours(userId: string, workingHours: any) {
    return this.updateUser(userId, { working_hours: workingHours })
  }

  // Update user profile
  static async updateUserProfile(userId: string, profile: {
    full_name?: string
    avatar_url?: string
  }) {
    return this.updateUser(userId, profile)
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    const [eventsResult, sessionsResult] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ])

    // Get message count separately
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)

    const sessionIds = sessions?.map(s => s.id) || []
    const messagesResult = sessionIds.length > 0 
      ? await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .in('session_id', sessionIds)
      : { count: 0 }

    const eventCount = eventsResult.count || 0
    const sessionCount = sessionsResult.count || 0
    const messageCount = messagesResult.count || 0

    return {
      totalEvents: eventCount,
      totalSessions: sessionCount,
      totalMessages: messageCount,
      averageMessagesPerSession: sessionCount > 0 ? messageCount / sessionCount : 0
    }
  }

  // Check if user exists
  static async userExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    return !error && !!data
  }

  // Get or create user (useful for auth callbacks)
  static async getOrCreateUser(authUser: {
    id: string
    email: string
    user_metadata?: any
  }) {
    try {
      // Try to get existing user
      const existingUser = await this.getUser(authUser.id)
      return existingUser
    } catch (error) {
      // User doesn't exist, create new one
      const newUser = await this.createUser({
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        timezone: 'UTC',
        working_hours: {
          start: 9,
          end: 17,
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        preferences: {
          theme: 'light',
          notifications: true,
          emailReminders: true
        }
      })
      return newUser
    }
  }

  // Search users (for admin purposes)
  static async searchUsers(query: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`)
    }

    return data || []
  }

  // Get users by creation date range
  static async getUsersByDateRange(startDate: Date, endDate: Date, limit: number = 50) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch users by date range: ${error.message}`)
    }

    return data || []
  }

  // Bulk update users
  static async bulkUpdateUsers(updates: Array<{ id: string; updates: Omit<UserUpdate, 'id' | 'created_at'> }>) {
    const promises = updates.map(({ id, updates: userUpdates }) =>
      this.updateUser(id, userUpdates)
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

  // Get user activity summary
  static async getUserActivitySummary(userId: string, days: number = 30) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [eventsResult, sessionsResult] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      supabase
        .from('chat_sessions')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ])

    // Get messages separately
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const sessionIds = sessions?.map(s => s.id) || []
    const messagesResult = sessionIds.length > 0 
      ? await supabase
          .from('chat_messages')
          .select('created_at')
          .in('session_id', sessionIds)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      : { data: [] }

    const events = eventsResult.data || []
    const sessionsData = sessionsResult.data || []
    const messages = messagesResult.data || []

    // Group by day
    const activityByDay: Record<string, { events: number; sessions: number; messages: number }> = {}

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      activityByDay[dateKey] = { events: 0, sessions: 0, messages: 0 }
    }

    events.forEach(event => {
      const dateKey = event.created_at.split('T')[0]
      if (activityByDay[dateKey]) {
        activityByDay[dateKey].events++
      }
    })

    sessionsData.forEach(session => {
      const dateKey = session.created_at.split('T')[0]
      if (activityByDay[dateKey]) {
        activityByDay[dateKey].sessions++
      }
    })

    messages.forEach(message => {
      const dateKey = message.created_at.split('T')[0]
      if (activityByDay[dateKey]) {
        activityByDay[dateKey].messages++
      }
    })

    return {
      period: { start: startDate, end: endDate, days },
      totalEvents: events.length,
      totalSessions: sessions.length,
      totalMessages: messages.length,
      activityByDay: Object.entries(activityByDay).map(([date, activity]) => ({
        date,
        ...activity
      }))
    }
  }
}
