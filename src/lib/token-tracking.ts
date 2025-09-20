import { z } from 'zod'

// Token usage tracking types
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
  timestamp: Date
  cost: number
  requestId: string
}

export interface CostOptimization {
  model: string
  maxTokens: number
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
}

// Token usage validation schema
const TokenUsageSchema = z.object({
  promptTokens: z.number().min(0),
  completionTokens: z.number().min(0),
  totalTokens: z.number().min(0),
  model: z.string(),
  timestamp: z.date(),
  cost: z.number().min(0),
  requestId: z.string()
})

// Cost per token for different models (as of 2024)
const MODEL_COSTS = {
  'gpt-4': {
    input: 0.03 / 1000, // $0.03 per 1K tokens
    output: 0.06 / 1000  // $0.06 per 1K tokens
  },
  'gpt-4-turbo': {
    input: 0.01 / 1000, // $0.01 per 1K tokens
    output: 0.03 / 1000  // $0.03 per 1K tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0015 / 1000, // $0.0015 per 1K tokens
    output: 0.002 / 1000   // $0.002 per 1K tokens
  }
} as const

// Token tracking manager
export class TokenTrackingManager {
  private usage: TokenUsage[] = []
  private dailyLimits: Map<string, number> = new Map()
  private monthlyLimits: Map<string, number> = new Map()

  // Track token usage
  trackUsage(
    promptTokens: number,
    completionTokens: number,
    model: string,
    requestId: string
  ): TokenUsage {
    const totalTokens = promptTokens + completionTokens
    const cost = this.calculateCost(promptTokens, completionTokens, model)
    
    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
      model,
      timestamp: new Date(),
      cost,
      requestId
    }

    // Validate usage
    const validatedUsage = usage as TokenUsage
    this.usage.push(validatedUsage)

    return validatedUsage
  }

  // Calculate cost for token usage
  private calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS]
    if (!modelCost) {
      console.warn(`Unknown model: ${model}, using gpt-4 pricing`)
      return this.calculateCost(promptTokens, completionTokens, 'gpt-4')
    }

    const inputCost = promptTokens * modelCost.input
    const outputCost = completionTokens * modelCost.output
    
    return inputCost + outputCost
  }

  // Get usage statistics
  getUsageStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): {
    totalTokens: number
    totalCost: number
    requestsCount: number
    averageTokensPerRequest: number
    costPerToken: number
    modelBreakdown: Record<string, {
      tokens: number
      cost: number
      requests: number
    }>
  } {
    const now = new Date()
    const cutoff = this.getCutoffDate(now, timeframe)
    
    const relevantUsage = this.usage.filter(u => u.timestamp >= cutoff)
    
    const totalTokens = relevantUsage.reduce((sum, u) => sum + u.totalTokens, 0)
    const totalCost = relevantUsage.reduce((sum, u) => sum + u.cost, 0)
    const requestsCount = relevantUsage.length
    
    const modelBreakdown: Record<string, {
      tokens: number
      cost: number
      requests: number
    }> = {}
    
    for (const usage of relevantUsage) {
      if (!modelBreakdown[usage.model]) {
        modelBreakdown[usage.model] = {
          tokens: 0,
          cost: 0,
          requests: 0
        }
      }
      
      modelBreakdown[usage.model].tokens += usage.totalTokens
      modelBreakdown[usage.model].cost += usage.cost
      modelBreakdown[usage.model].requests += 1
    }

    return {
      totalTokens,
      totalCost,
      requestsCount,
      averageTokensPerRequest: requestsCount > 0 ? totalTokens / requestsCount : 0,
      costPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
      modelBreakdown
    }
  }

  // Get cutoff date for timeframe
  private getCutoffDate(now: Date, timeframe: string): Date {
    const cutoff = new Date(now)
    
    switch (timeframe) {
      case 'hour':
        cutoff.setHours(cutoff.getHours() - 1)
        break
      case 'day':
        cutoff.setDate(cutoff.getDate() - 1)
        break
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1)
        break
    }
    
    return cutoff
  }

  // Check if usage exceeds limits
  checkLimits(userId: string): {
    dailyExceeded: boolean
    monthlyExceeded: boolean
    dailyUsage: number
    monthlyUsage: number
    dailyLimit: number
    monthlyLimit: number
  } {
    const dailyLimit = this.dailyLimits.get(userId) || 100000 // 100K tokens per day
    const monthlyLimit = this.monthlyLimits.get(userId) || 2000000 // 2M tokens per month
    
    const dailyStats = this.getUsageStats('day')
    const monthlyStats = this.getUsageStats('month')
    
    return {
      dailyExceeded: dailyStats.totalTokens > dailyLimit,
      monthlyExceeded: monthlyStats.totalTokens > monthlyLimit,
      dailyUsage: dailyStats.totalTokens,
      monthlyUsage: monthlyStats.totalTokens,
      dailyLimit,
      monthlyLimit
    }
  }

  // Set usage limits for user
  setLimits(userId: string, dailyLimit: number, monthlyLimit: number): void {
    this.dailyLimits.set(userId, dailyLimit)
    this.monthlyLimits.set(userId, monthlyLimit)
  }

  // Get cost optimization suggestions
  getOptimizationSuggestions(): CostOptimization[] {
    const suggestions: CostOptimization[] = []
    
    // Check if using expensive models
    const stats = this.getUsageStats('day')
    const gpt4Usage = stats.modelBreakdown['gpt-4'] || { tokens: 0, cost: 0, requests: 0 }
    const gpt4TurboUsage = stats.modelBreakdown['gpt-4-turbo'] || { tokens: 0, cost: 0, requests: 0 }
    
    if (gpt4Usage.tokens > 0 && gpt4TurboUsage.tokens === 0) {
      suggestions.push({
        model: 'gpt-4-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        frequencyPenalty: 0,
        presencePenalty: 0
      })
    }
    
    // Check for high token usage
    if (stats.averageTokensPerRequest > 2000) {
      suggestions.push({
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        frequencyPenalty: 0,
        presencePenalty: 0
      })
    }
    
    return suggestions
  }

  // Estimate cost for request
  estimateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    return this.calculateCost(promptTokens, completionTokens, model)
  }

  // Get model recommendations based on usage
  getModelRecommendation(
    taskType: 'calendar' | 'chat' | 'analysis' | 'generation'
  ): {
    model: string
    maxTokens: number
    temperature: number
    reasoning: string
  } {
    const stats = this.getUsageStats('day')
    const isHighUsage = stats.totalTokens > 50000
    
    switch (taskType) {
      case 'calendar':
        return {
          model: isHighUsage ? 'gpt-3.5-turbo' : 'gpt-4-turbo',
          maxTokens: 1000,
          temperature: 0.3,
          reasoning: 'Calendar parsing requires precision and structured output'
        }
      
      case 'chat':
        return {
          model: isHighUsage ? 'gpt-3.5-turbo' : 'gpt-4',
          maxTokens: 1500,
          temperature: 0.7,
          reasoning: 'Chat requires conversational ability and context understanding'
        }
      
      case 'analysis':
        return {
          model: 'gpt-4',
          maxTokens: 2000,
          temperature: 0.4,
          reasoning: 'Analysis requires complex reasoning and detailed output'
        }
      
      case 'generation':
        return {
          model: isHighUsage ? 'gpt-3.5-turbo' : 'gpt-4',
          maxTokens: 2000,
          temperature: 0.8,
          reasoning: 'Content generation benefits from creativity and longer responses'
        }
      
      default:
        return {
          model: 'gpt-4-turbo',
          maxTokens: 1000,
          temperature: 0.7,
          reasoning: 'Default recommendation for general use'
        }
    }
  }

  // Clear old usage data
  clearOldUsage(daysToKeep: number = 30): void {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysToKeep)
    
    this.usage = this.usage.filter(u => u.timestamp >= cutoff)
  }

  // Export usage data
  exportUsage(): TokenUsage[] {
    return [...this.usage]
  }

  // Import usage data
  importUsage(usage: TokenUsage[]): void {
    const validatedUsage = usage.map(u => u as TokenUsage)    
    this.usage.push(...validatedUsage)
  }
}

// Global token tracking manager
export const tokenTracker = new TokenTrackingManager()

// Clean up old usage data daily
setInterval(() => {
  tokenTracker.clearOldUsage(30)
}, 24 * 60 * 60 * 1000)
