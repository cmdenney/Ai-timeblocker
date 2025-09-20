import { z } from 'zod'

// Conversation context types
export interface ConversationContext {
  id: string
  userId: string
  timezone: string
  currentDate: Date
  workingHours: { start: string; end: string }
  userPreferences: Record<string, any>
  recentEvents: Array<{
    id: string
    title: string
    startTime: Date
    endTime: Date
    category: string
  }>
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    metadata?: Record<string, any>
  }>
  lastInteraction: Date
  sessionData: {
    totalTokens: number
    estimatedCost: number
    requestsCount: number
  }
}

// Context validation schema
const ConversationContextSchema = z.object({
  id: z.string(),
  userId: z.string(),
  timezone: z.string(),
  currentDate: z.date(),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }),
  userPreferences: z.record(z.any()),
  recentEvents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    category: z.string()
  })),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.date(),
    metadata: z.record(z.any()).optional()
  })),
  lastInteraction: z.date(),
  sessionData: z.object({
    totalTokens: z.number(),
    estimatedCost: z.number(),
    requestsCount: z.number()
  })
})

// Context manager class
export class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private readonly maxContextAge = 24 * 60 * 60 * 1000 // 24 hours
  private readonly maxHistoryLength = 50

  // Create or get existing context
  async getContext(
    userId: string,
    timezone: string = 'UTC',
    userPreferences: Record<string, any> = {},
    recentEvents: Array<{
      id: string
      title: string
      startTime: Date
      endTime: Date
      category: string
    }> = []
  ): Promise<ConversationContext> {
    const contextId = `${userId}-${timezone}`
    
    let context = this.contexts.get(contextId)
    
    if (!context || this.isContextExpired(context)) {
      context = await this.createNewContext(
        contextId,
        userId,
        timezone,
        userPreferences,
        recentEvents
      )
      this.contexts.set(contextId, context)
    }

    // Update last interaction
    context.lastInteraction = new Date()
    
    return context
  }

  // Create new context
  private async createNewContext(
    contextId: string,
    userId: string,
    timezone: string,
    userPreferences: Record<string, any>,
    recentEvents: Array<{
      id: string
      title: string
      startTime: Date
      endTime: Date
      category: string
    }>
  ): Promise<ConversationContext> {
    const now = new Date()
    
    return {
      id: contextId,
      userId,
      timezone,
      currentDate: now,
      workingHours: userPreferences.workingHours || { start: '09:00', end: '17:00' },
      userPreferences,
      recentEvents: recentEvents.slice(-10), // Keep last 10 events
      conversationHistory: [],
      lastInteraction: now,
      sessionData: {
        totalTokens: 0,
        estimatedCost: 0,
        requestsCount: 0
      }
    }
  }

  // Add message to conversation history
  addMessage(
    contextId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): void {
    const context = this.contexts.get(contextId)
    if (!context) return

    context.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
      metadata
    })

    // Trim history if too long
    if (context.conversationHistory.length > this.maxHistoryLength) {
      context.conversationHistory = context.conversationHistory.slice(-this.maxHistoryLength)
    }
  }

  // Update session data
  updateSessionData(
    contextId: string,
    tokens: number,
    cost: number
  ): void {
    const context = this.contexts.get(contextId)
    if (!context) return

    context.sessionData.totalTokens += tokens
    context.sessionData.estimatedCost += cost
    context.sessionData.requestsCount += 1
  }

  // Get conversation summary for context
  getConversationSummary(contextId: string, maxLength: number = 1000): string {
    const context = this.contexts.get(contextId)
    if (!context) return ''

    const recentMessages = context.conversationHistory.slice(-10)
    let summary = ''
    
    for (const message of recentMessages) {
      const content = message.content.slice(0, 200) // Limit per message
      summary += `${message.role}: ${content}\n`
      
      if (summary.length > maxLength) {
        break
      }
    }

    return summary.trim()
  }

  // Get relevant context for AI
  getRelevantContext(contextId: string): {
    timezone: string
    currentDate: Date
    workingHours: { start: string; end: string }
    userPreferences: Record<string, any>
    recentEvents: Array<{
      id: string
      title: string
      startTime: Date
      endTime: Date
      category: string
    }>
    conversationSummary: string
  } {
    const context = this.contexts.get(contextId)
    if (!context) {
      throw new Error('Context not found')
    }

    return {
      timezone: context.timezone,
      currentDate: context.currentDate,
      workingHours: context.workingHours,
      userPreferences: context.userPreferences,
      recentEvents: context.recentEvents,
      conversationSummary: this.getConversationSummary(contextId)
    }
  }

  // Check if context is expired
  private isContextExpired(context: ConversationContext): boolean {
    const age = Date.now() - context.lastInteraction.getTime()
    return age > this.maxContextAge
  }

  // Clean up expired contexts
  cleanupExpiredContexts(): void {
    for (const [contextId, context] of this.contexts.entries()) {
      if (this.isContextExpired(context)) {
        this.contexts.delete(contextId)
      }
    }
  }

  // Get context statistics
  getContextStats(): {
    totalContexts: number
    totalTokens: number
    totalCost: number
    totalRequests: number
  } {
    let totalTokens = 0
    let totalCost = 0
    let totalRequests = 0

    for (const context of this.contexts.values()) {
      totalTokens += context.sessionData.totalTokens
      totalCost += context.sessionData.estimatedCost
      totalRequests += context.sessionData.requestsCount
    }

    return {
      totalContexts: this.contexts.size,
      totalTokens,
      totalCost,
      totalRequests
    }
  }

  // Clear all contexts
  clearAllContexts(): void {
    this.contexts.clear()
  }

  // Export context for persistence
  exportContext(contextId: string): ConversationContext | null {
    return this.contexts.get(contextId) || null
  }

  // Import context from persistence
  importContext(context: ConversationContext): void {
    try {
      this.contexts.set(context.id, context)
    } catch (error) {
      console.error('Failed to import context:', error)
    }
  }
}

// Global context manager instance
export const contextManager = new ConversationContextManager()

// Cleanup expired contexts every hour
setInterval(() => {
  contextManager.cleanupExpiredContexts()
}, 60 * 60 * 1000)
