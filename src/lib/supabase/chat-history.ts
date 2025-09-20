import { ChatService } from './services/chat'
import { AuthService } from './auth'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sessionId: string
  threadId?: string
  metadata?: {
    parsedEvents?: any[]
    confidence?: number
    suggestions?: string[]
    conflicts?: Array<{
      type: string
      description: string
      severity: string
    }>
    tokens?: number
    cost?: number
  }
  replies?: ChatMessage[]
}

export interface ParsedEvent {
  title: string
  startDate: Date
  endDate: Date
  isAllDay: boolean
  recurrence?: string
  location?: string
  description?: string
  confidence: number
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
  messageCount: number
  userId: string
  metadata?: {
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
    category?: string
    summary?: string
  }
}

export interface MessageThread {
  id: string
  sessionId: string
  parentId?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  isCollapsed: boolean
  metadata?: {
    title?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
  }
}

export class SupabaseChatHistoryManager {
  // Session management
  static async createSession(userId: string, title?: string, metadata?: any): Promise<ChatSession> {
    const session = await ChatService.createSession({
      user_id: userId,
      title: title || 'New Chat',
      metadata
    })

    return {
      id: session.id,
      userId: session.user_id,
      title: session.title,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
      lastMessageAt: new Date(session.last_message_at),
      messageCount: session.message_count,
      metadata: session.metadata
    }
  }

  static async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const session = await ChatService.getSession(sessionId)
      
      return {
        id: session.id,
        userId: session.user_id,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        lastMessageAt: new Date(session.last_message_at),
        messageCount: session.message_count,
        metadata: session.metadata
      }
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  static async getSessionsByUser(userId: string, options?: { limit?: number; offset?: number }): Promise<ChatSession[]> {
    try {
      const sessions = await ChatService.getSessions(userId, options)
      
      return sessions.map(session => ({
        id: session.id,
        userId: session.user_id,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        lastMessageAt: new Date(session.last_message_at),
        messageCount: session.message_count,
        metadata: session.metadata
      }))
    } catch (error) {
      console.error('Failed to get sessions:', error)
      return []
    }
  }

  static async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
    try {
      const session = await ChatService.updateSession(sessionId, {
        title: updates.title,
        metadata: updates.metadata
      })

      return {
        id: session.id,
        userId: session.user_id,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        lastMessageAt: new Date(session.last_message_at),
        messageCount: session.message_count,
        metadata: session.metadata
      }
    } catch (error) {
      console.error('Failed to update session:', error)
      return null
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await ChatService.deleteSession(sessionId)
      return true
    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }

  // Thread management
  static async createThread(sessionId: string, parentId?: string, metadata?: any): Promise<MessageThread> {
    const thread = await ChatService.createThread({
      session_id: sessionId,
      parent_id: parentId,
      metadata
    })

    return {
      id: thread.id,
      sessionId: thread.session_id,
      parentId: thread.parent_id || undefined,
      messages: [],
      createdAt: new Date(thread.created_at),
      updatedAt: new Date(thread.updated_at),
      isCollapsed: thread.is_collapsed,
      metadata: thread.metadata
    }
  }

  static async getThread(threadId: string): Promise<MessageThread | null> {
    try {
      const thread = await ChatService.getThread(threadId)
      
      return {
        id: thread.id,
        sessionId: thread.session_id,
        parentId: thread.parent_id || undefined,
        messages: [],
        createdAt: new Date(thread.created_at),
        updatedAt: new Date(thread.updated_at),
        isCollapsed: thread.is_collapsed,
        metadata: thread.metadata
      }
    } catch (error) {
      console.error('Failed to get thread:', error)
      return null
    }
  }

  static async getThreadsBySession(sessionId: string): Promise<MessageThread[]> {
    try {
      const threads = await ChatService.getThreads(sessionId)
      
      return threads.map(thread => ({
        id: thread.id,
        sessionId: thread.session_id,
        parentId: thread.parent_id || undefined,
        messages: [],
        createdAt: new Date(thread.created_at),
        updatedAt: new Date(thread.updated_at),
        isCollapsed: thread.is_collapsed,
        metadata: thread.metadata
      }))
    } catch (error) {
      console.error('Failed to get threads:', error)
      return []
    }
  }

  static async updateThread(threadId: string, updates: Partial<MessageThread>): Promise<MessageThread | null> {
    try {
      const thread = await ChatService.updateThread(threadId, {
        title: updates.metadata?.title,
        metadata: updates.metadata,
        is_collapsed: updates.isCollapsed
      })

      return {
        id: thread.id,
        sessionId: thread.session_id,
        parentId: thread.parent_id || undefined,
        messages: [],
        createdAt: new Date(thread.created_at),
        updatedAt: new Date(thread.updated_at),
        isCollapsed: thread.is_collapsed,
        metadata: thread.metadata
      }
    } catch (error) {
      console.error('Failed to update thread:', error)
      return null
    }
  }

  static async deleteThread(threadId: string): Promise<boolean> {
    try {
      await ChatService.deleteThread(threadId)
      return true
    } catch (error) {
      console.error('Failed to delete thread:', error)
      return false
    }
  }

  // Message management
  static async createMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage> {
    const message = await ChatService.createMessage({
      session_id: sessionId,
      role,
      content,
      metadata
    })

    return {
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      timestamp: new Date(message.created_at),
      sessionId: message.session_id,
      metadata: message.metadata
    }
  }

  static async getMessage(messageId: string): Promise<ChatMessage | null> {
    try {
      const message = await ChatService.getMessage(messageId)
      
      return {
        id: message.id,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        timestamp: new Date(message.created_at),
        sessionId: message.session_id,
        metadata: message.metadata
      }
    } catch (error) {
      console.error('Failed to get message:', error)
      return null
    }
  }

  static async getMessages(sessionId: string, options?: { limit?: number; offset?: number }): Promise<ChatMessage[]> {
    try {
      const messages = await ChatService.getMessages(sessionId, options)
      
      return messages.map(message => ({
        id: message.id,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        timestamp: new Date(message.created_at),
        sessionId: message.session_id,
        metadata: message.metadata
      }))
    } catch (error) {
      console.error('Failed to get messages:', error)
      return []
    }
  }

  static async updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null> {
    try {
      const message = await ChatService.updateMessage(messageId, {
        role: updates.role,
        content: updates.content,
        metadata: updates.metadata
      })

      return {
        id: message.id,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        timestamp: new Date(message.created_at),
        sessionId: message.session_id,
        metadata: message.metadata
      }
    } catch (error) {
      console.error('Failed to update message:', error)
      return null
    }
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await ChatService.deleteMessage(messageId)
      return true
    } catch (error) {
      console.error('Failed to delete message:', error)
      return false
    }
  }

  // Search and filtering
  static async searchMessages(userId: string, query: string): Promise<ChatMessage[]> {
    try {
      const messages = await ChatService.searchMessages(userId, query)
      
      return messages.map(message => ({
        id: message.id,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        timestamp: new Date(message.created_at),
        sessionId: message.session_id,
        metadata: message.metadata
      }))
    } catch (error) {
      console.error('Failed to search messages:', error)
      return []
    }
  }

  static async getMessagesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ChatMessage[]> {
    try {
      const messages = await ChatService.getMessagesByDateRange(userId, startDate, endDate)
      
      return messages.map(message => ({
        id: message.id,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        timestamp: new Date(message.created_at),
        sessionId: message.session_id,
        metadata: message.metadata
      }))
    } catch (error) {
      console.error('Failed to get messages by date range:', error)
      return []
    }
  }

  static async getMessagesWithEvents(sessionId: string): Promise<ChatMessage[]> {
    try {
      const messages = await this.getMessages(sessionId)
      return messages.filter(message => 
        message.metadata?.parsedEvents && message.metadata.parsedEvents.length > 0
      )
    } catch (error) {
      console.error('Failed to get messages with events:', error)
      return []
    }
  }

  // Statistics
  static async getSessionStats(sessionId: string): Promise<{
    totalMessages: number
    totalTokens: number
    totalCost: number
    eventsCreated: number
    averageConfidence: number
  } | null> {
    try {
      const stats = await ChatService.getSessionStats(sessionId)
      const messages = await this.getMessages(sessionId)
      
      const eventsCreated = messages.reduce((sum, msg) => 
        sum + (msg.metadata?.parsedEvents?.length || 0), 0
      )
      const averageConfidence = messages.reduce((sum, msg) => 
        sum + (msg.metadata?.confidence || 0), 0
      ) / messages.length || 0

      return {
        totalMessages: stats.totalMessages,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
        eventsCreated,
        averageConfidence
      }
    } catch (error) {
      console.error('Failed to get session stats:', error)
      return null
    }
  }

  // Export and import
  static async exportSession(sessionId: string): Promise<{
    session: ChatSession
    threads: MessageThread[]
    messages: ChatMessage[]
  } | null> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) return null

      const threads = await this.getThreadsBySession(sessionId)
      const messages = await this.getMessages(sessionId)

      return { session, threads, messages }
    } catch (error) {
      console.error('Failed to export session:', error)
      return null
    }
  }

  // Cleanup
  static async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      // This would need to be implemented in the ChatService
      // For now, we'll just log that cleanup would happen
      console.log(`Would cleanup data older than ${cutoffDate.toISOString()}`)
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
    }
  }
}

// For backward compatibility, create a singleton instance
export const chatHistoryManager = {
  createSession: SupabaseChatHistoryManager.createSession,
  getSession: SupabaseChatHistoryManager.getSession,
  getSessionsByUser: SupabaseChatHistoryManager.getSessionsByUser,
  updateSession: SupabaseChatHistoryManager.updateSession,
  deleteSession: SupabaseChatHistoryManager.deleteSession,
  createThread: SupabaseChatHistoryManager.createThread,
  getThread: SupabaseChatHistoryManager.getThread,
  getThreadsBySession: SupabaseChatHistoryManager.getThreadsBySession,
  updateThread: SupabaseChatHistoryManager.updateThread,
  deleteThread: SupabaseChatHistoryManager.deleteThread,
  createMessage: SupabaseChatHistoryManager.createMessage,
  getMessage: SupabaseChatHistoryManager.getMessage,
  getMessages: SupabaseChatHistoryManager.getMessages,
  updateMessage: SupabaseChatHistoryManager.updateMessage,
  deleteMessage: SupabaseChatHistoryManager.deleteMessage,
  searchMessages: SupabaseChatHistoryManager.searchMessages,
  getMessagesByDateRange: SupabaseChatHistoryManager.getMessagesByDateRange,
  getMessagesWithEvents: SupabaseChatHistoryManager.getMessagesWithEvents,
  getSessionStats: SupabaseChatHistoryManager.getSessionStats,
  exportSession: SupabaseChatHistoryManager.exportSession,
  cleanupOldData: SupabaseChatHistoryManager.cleanupOldData
}
