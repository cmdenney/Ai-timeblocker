import { supabase } from '../client'
import { Database } from '../database.types'

type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert']
type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update']

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

type ChatThread = Database['public']['Tables']['chat_threads']['Row']
type ChatThreadInsert = Database['public']['Tables']['chat_threads']['Insert']
type ChatThreadUpdate = Database['public']['Tables']['chat_threads']['Update']

export class ChatService {
  // Session Management
  static async getSessions(userId: string, options?: {
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data || []
  }

  static async getSession(sessionId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch session: ${error.message}`)
    }

    return data
  }

  static async createSession(session: Omit<ChatSessionInsert, 'id' | 'created_at' | 'updated_at' | 'last_message_at' | 'message_count'>) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        ...session,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        message_count: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  static async updateSession(sessionId: string, updates: Omit<ChatSessionUpdate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`)
    }

    return data
  }

  static async deleteSession(sessionId: string) {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`)
    }

    return true
  }

  // Message Management
  static async getMessages(sessionId: string, options?: {
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    return data || []
  }

  static async getMessage(messageId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch message: ${error.message}`)
    }

    return data
  }

  static async createMessage(message: Omit<ChatMessageInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        ...message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`)
    }

    // Update session message count and last message time
    await this.updateSession(message.session_id, {
      message_count: await this.getMessageCount(message.session_id),
      last_message_at: new Date().toISOString()
    })

    return data
  }

  static async updateMessage(messageId: string, updates: Omit<ChatMessageUpdate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`)
    }

    return data
  }

  static async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`)
    }

    return true
  }

  // Thread Management
  static async getThreads(sessionId: string) {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch threads: ${error.message}`)
    }

    return data || []
  }

  static async getThread(threadId: string) {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch thread: ${error.message}`)
    }

    return data
  }

  static async createThread(thread: Omit<ChatThreadInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({
        ...thread,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_collapsed: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create thread: ${error.message}`)
    }

    return data
  }

  static async updateThread(threadId: string, updates: Omit<ChatThreadUpdate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('chat_threads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update thread: ${error.message}`)
    }

    return data
  }

  static async deleteThread(threadId: string) {
    const { error } = await supabase
      .from('chat_threads')
      .delete()
      .eq('id', threadId)

    if (error) {
      throw new Error(`Failed to delete thread: ${error.message}`)
    }

    return true
  }

  // Search and Filtering
  static async searchMessages(userId: string, searchQuery: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        chat_sessions!inner(user_id)
      `)
      .eq('chat_sessions.user_id', userId)
      .or(`content.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`)
    }

    return data || []
  }

  static async getMessagesByDateRange(userId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        chat_sessions!inner(user_id)
      `)
      .eq('chat_sessions.user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch messages by date range: ${error.message}`)
    }

    return data || []
  }

  // Statistics
  static async getSessionStats(sessionId: string) {
    const [messages, session] = await Promise.all([
      this.getMessages(sessionId),
      this.getSession(sessionId)
    ])

    const totalMessages = messages.length
    const totalTokens = messages.reduce((sum, msg) => 
      sum + ((msg.metadata as any)?.tokens || 0), 0
    )
    const totalCost = messages.reduce((sum, msg) => 
      sum + ((msg.metadata as any)?.cost || 0), 0
    )

    return {
      totalMessages,
      totalTokens,
      totalCost,
      averageTokensPerMessage: totalMessages > 0 ? totalTokens / totalMessages : 0,
      averageCostPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
      sessionCreatedAt: session.created_at,
      lastMessageAt: session.last_message_at
    }
  }

  // Helper methods
  private static async getMessageCount(sessionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`Failed to get message count: ${error.message}`)
    }

    return count || 0
  }

  // Bulk operations
  static async createMessages(messages: Omit<ChatMessageInsert, 'id' | 'created_at' | 'updated_at'>[]) {
    const messagesWithTimestamps = messages.map(message => ({
      ...message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messagesWithTimestamps)
      .select()

    if (error) {
      throw new Error(`Failed to create messages: ${error.message}`)
    }

    return data || []
  }

  static async deleteSessionMessages(sessionId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`Failed to delete session messages: ${error.message}`)
    }

    return true
  }
}
