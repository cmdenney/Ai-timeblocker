import { z } from 'zod'

// Chat message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    parsedEvents?: ParsedEvent[]
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

// Chat session types
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

// Message thread types
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

// Validation schemas
const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.object({
    parsedEvents: z.array(z.any()).optional(),
    confidence: z.number().optional(),
    suggestions: z.array(z.string()).optional(),
    conflicts: z.array(z.object({
      type: z.string(),
      description: z.string(),
      severity: z.string()
    })).optional(),
    tokens: z.number().optional(),
    cost: z.number().optional()
  }).optional(),
  replies: z.array(z.any()).optional()
})

const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastMessageAt: z.date(),
  messageCount: z.number(),
  userId: z.string(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    category: z.string().optional(),
    summary: z.string().optional()
  }).optional()
})

const MessageThreadSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  parentId: z.string().optional(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  isCollapsed: z.boolean(),
  metadata: z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
})

// Chat history manager
export class ChatHistoryManager {
  private sessions: Map<string, ChatSession> = new Map()
  private threads: Map<string, MessageThread> = new Map()
  private messages: Map<string, ChatMessage> = new Map()

  // Session management
  createSession(userId: string, title?: string): ChatSession {
    const session: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      userId,
      metadata: {
        tags: [],
        priority: 'medium'
      }
    }

    this.sessions.set(session.id, session)
    return session
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId)
  }

  getSessionsByUser(userId: string): ChatSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
  }

  updateSession(sessionId: string, updates: Partial<ChatSession>): ChatSession | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    }

    this.sessions.set(sessionId, updatedSession)
    return updatedSession
  }

  deleteSession(sessionId: string): boolean {
    // Delete all threads and messages for this session
    const sessionThreads = Array.from(this.threads.values())
      .filter(thread => thread.sessionId === sessionId)

    for (const thread of sessionThreads) {
      this.deleteThread(thread.id)
    }

    return this.sessions.delete(sessionId)
  }

  // Thread management
  createThread(sessionId: string, parentId?: string): MessageThread {
    const thread: MessageThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      parentId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isCollapsed: false,
      metadata: {
        tags: [],
        priority: 'medium'
      }
    }

    this.threads.set(thread.id, thread)
    return thread
  }

  getThread(threadId: string): MessageThread | undefined {
    return this.threads.get(threadId)
  }

  getThreadsBySession(sessionId: string): MessageThread[] {
    return Array.from(this.threads.values())
      .filter(thread => thread.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  addMessageToThread(threadId: string, message: ChatMessage): MessageThread | null {
    const thread = this.threads.get(threadId)
    if (!thread) return null

    const updatedThread = {
      ...thread,
      messages: [...thread.messages, message],
      updatedAt: new Date()
    }

    this.threads.set(threadId, updatedThread)
    this.messages.set(message.id, message)

    // Update session message count
    const session = this.sessions.get(thread.sessionId)
    if (session) {
      this.updateSession(thread.sessionId, {
        messageCount: session.messageCount + 1,
        lastMessageAt: new Date()
      })
    }

    return updatedThread
  }

  updateThread(threadId: string, updates: Partial<MessageThread>): MessageThread | null {
    const thread = this.threads.get(threadId)
    if (!thread) return null

    const updatedThread = {
      ...thread,
      ...updates,
      updatedAt: new Date()
    }

    this.threads.set(threadId, updatedThread)
    return updatedThread
  }

  deleteThread(threadId: string): boolean {
    const thread = this.threads.get(threadId)
    if (!thread) return false

    // Delete all messages in this thread
    for (const message of thread.messages) {
      this.messages.delete(message.id)
    }

    return this.threads.delete(threadId)
  }

  // Message management
  createMessage(
    role: 'user' | 'assistant',
    content: string,
    metadata?: ChatMessage['metadata']
  ): ChatMessage {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      metadata
    }

    this.messages.set(message.id, message)
    return message
  }

  getMessage(messageId: string): ChatMessage | undefined {
    return this.messages.get(messageId)
  }

  updateMessage(messageId: string, updates: Partial<ChatMessage>): ChatMessage | null {
    const message = this.messages.get(messageId)
    if (!message) return null

    const updatedMessage = {
      ...message,
      ...updates
    }

    this.messages.set(messageId, updatedMessage)
    return updatedMessage
  }

  deleteMessage(messageId: string): boolean {
    return this.messages.delete(messageId)
  }

  // Search and filtering
  searchMessages(query: string, sessionId?: string): ChatMessage[] {
    const searchTerm = query.toLowerCase()
    let messages = Array.from(this.messages.values())

    if (sessionId) {
      const sessionThreads = this.getThreadsBySession(sessionId)
      const sessionMessageIds = new Set(
        sessionThreads.flatMap(thread => thread.messages.map(msg => msg.id))
      )
      messages = messages.filter(msg => sessionMessageIds.has(msg.id))
    }

    return messages.filter(message =>
      message.content.toLowerCase().includes(searchTerm) ||
      message.metadata?.parsedEvents?.some(event =>
        event.title.toLowerCase().includes(searchTerm)
      )
    )
  }

  getMessagesByDateRange(startDate: Date, endDate: Date, sessionId?: string): ChatMessage[] {
    let messages = Array.from(this.messages.values())

    if (sessionId) {
      const sessionThreads = this.getThreadsBySession(sessionId)
      const sessionMessageIds = new Set(
        sessionThreads.flatMap(thread => thread.messages.map(msg => msg.id))
      )
      messages = messages.filter(msg => sessionMessageIds.has(msg.id))
    }

    return messages.filter(message =>
      message.timestamp >= startDate && message.timestamp <= endDate
    )
  }

  getMessagesWithEvents(sessionId?: string): ChatMessage[] {
    let messages = Array.from(this.messages.values())

    if (sessionId) {
      const sessionThreads = this.getThreadsBySession(sessionId)
      const sessionMessageIds = new Set(
        sessionThreads.flatMap(thread => thread.messages.map(msg => msg.id))
      )
      messages = messages.filter(msg => sessionMessageIds.has(msg.id))
    }

    return messages.filter(message =>
      message.metadata?.parsedEvents && message.metadata.parsedEvents.length > 0
    )
  }

  // Statistics
  getSessionStats(sessionId: string): {
    totalMessages: number
    totalTokens: number
    totalCost: number
    eventsCreated: number
    averageConfidence: number
  } {
    const threads = this.getThreadsBySession(sessionId)
    const allMessages = threads.flatMap(thread => thread.messages)

    const totalMessages = allMessages.length
    const totalTokens = allMessages.reduce((sum, msg) => sum + (msg.metadata?.tokens || 0), 0)
    const totalCost = allMessages.reduce((sum, msg) => sum + (msg.metadata?.cost || 0), 0)
    const eventsCreated = allMessages.reduce((sum, msg) => 
      sum + (msg.metadata?.parsedEvents?.length || 0), 0
    )
    const averageConfidence = allMessages.reduce((sum, msg) => 
      sum + (msg.metadata?.confidence || 0), 0
    ) / totalMessages || 0

    return {
      totalMessages,
      totalTokens,
      totalCost,
      eventsCreated,
      averageConfidence
    }
  }

  // Export and import
  exportSession(sessionId: string): {
    session: ChatSession
    threads: MessageThread[]
    messages: ChatMessage[]
  } | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const threads = this.getThreadsBySession(sessionId)
    const messages = threads.flatMap(thread => thread.messages)

    return { session, threads, messages }
  }

  importSession(data: {
    session: ChatSession
    threads: MessageThread[]
    messages: ChatMessage[]
  }): boolean {
    try {
      // Import data directly without validation for now
      this.sessions.set(data.session.id, data.session)
      
      for (const thread of data.threads) {
        this.threads.set(thread.id, thread)
      }
      
      for (const message of data.messages) {
        this.messages.set(message.id, message)
      }

      return true
    } catch (error) {
      console.error('Error importing session:', error)
      return false
    }
  }

  // Cleanup
  cleanupOldData(daysToKeep: number = 30): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // Clean up old sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastMessageAt < cutoffDate) {
        this.deleteSession(sessionId)
      }
    }

    // Clean up old messages
    for (const [messageId, message] of this.messages.entries()) {
      if (message.timestamp < cutoffDate) {
        this.messages.delete(messageId)
      }
    }
  }

  // Get all data
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values())
  }

  getAllThreads(): MessageThread[] {
    return Array.from(this.threads.values())
  }

  getAllMessages(): ChatMessage[] {
    return Array.from(this.messages.values())
  }

  // Clear all data
  clearAllData(): void {
    this.sessions.clear()
    this.threads.clear()
    this.messages.clear()
  }
}

// Global chat history manager instance
export const chatHistoryManager = new ChatHistoryManager()

// Cleanup old data every day
setInterval(() => {
  chatHistoryManager.cleanupOldData(30)
}, 24 * 60 * 60 * 1000)
