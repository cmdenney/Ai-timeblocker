import OpenAI from 'openai'
import { openai } from './openai'
import { tokenTracker } from './token-tracking'

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'rate_limit_exceeded',
    'server_error',
    'timeout',
    'network_error',
    'service_unavailable'
  ]
}

// Error types
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if error is retryable
      if (!isRetryableError(error, retryConfig.retryableErrors)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === retryConfig.maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelay
      )

      console.warn(`OpenAI request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new OpenAIError(
    `OpenAI request failed after ${retryConfig.maxRetries + 1} attempts`,
    'max_retries_exceeded',
    undefined,
    false
  )
}

// Check if error is retryable
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false

  // Check OpenAI API errors
  if (error instanceof OpenAI.APIError) {
    return retryableErrors.includes(error.code) || 
           error.status >= 500 || 
           error.status === 429
  }

  // Check network errors
  if (error.code === 'ENOTFOUND' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT') {
    return true
  }

  // Check error message for retryable patterns
  const errorMessage = error.message?.toLowerCase() || ''
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError.toLowerCase())
  )
}

// Enhanced OpenAI client with retry logic
export class RetryableOpenAIClient {
  private client: OpenAI
  private retryConfig: RetryConfig

  constructor(client: OpenAI, retryConfig: Partial<RetryConfig> = {}) {
    this.client = client
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  }

  // Chat completion with retry
  async chatCompletionsCreate(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParams
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    return withRetry(
      () => this.client.chat.completions.create(params),
      this.retryConfig
    ) as Promise<OpenAI.Chat.Completions.ChatCompletion>
  }

  // Streaming chat completion with retry
  async chatCompletionsCreateStream(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParams
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    return withRetry(
      () => this.client.chat.completions.create({
        ...params,
        stream: true
      }),
      this.retryConfig
    )
  }

  // Models list with retry
  async modelsList(): Promise<OpenAI.Models.ModelsPage> {
    return withRetry(
      () => this.client.models.list(),
      this.retryConfig
    )
  }
}

// Create retryable client instance
export const retryableOpenAI = new RetryableOpenAIClient(openai)

// Enhanced calendar parsing with retry and error handling
export async function parseCalendarEventsWithRetry(
  userInput: string,
  timezone: string = 'UTC',
  context?: {
    currentDate?: Date
    workingHours?: { start: string; end: string }
    existingEvents?: Array<{ title: string; startTime: Date; endTime: Date }>
    preferences?: Record<string, any>
  }
) {
  try {
    const startTime = Date.now()
    
    const response = await retryableOpenAI.chatCompletionsCreate({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in parsing natural language into calendar events.

Parse the user's input and extract calendar events with the following JSON structure:
{
  "events": [
    {
      "title": "Event title",
      "startDate": "ISO date string",
      "endDate": "ISO date string",
      "isAllDay": boolean,
      "recurrence": "RRULE string or null",
      "location": "location or null",
      "description": "description or null",
      "confidence": 0.0-1.0,
      "category": "work|personal|meeting|break|focus|other",
      "priority": "low|medium|high|urgent"
    }
  ],
  "message": "Human-friendly confirmation message",
  "suggestions": ["helpful suggestions"],
  "conflicts": [
    {
      "type": "overlap|insufficient_break|energy_mismatch",
      "description": "conflict description",
      "severity": "low|medium|high"
    }
  ]
}

Rules:
- Always extract start and end times
- Default duration is 1 hour if not specified
- Use current year if year not mentioned
- Handle relative dates (today, tomorrow, next week, etc.)
- Parse recurrence patterns into RRULE format
- Provide confidence score based on clarity (0.0-1.0)
- Categorize events appropriately
- Assign priority based on urgency indicators
- Detect conflicts and overlapping events
- Suggest optimizations for time management`
        },
        {
          role: 'user',
          content: `Parse this calendar request (timezone: ${timezone}): "${userInput}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // Track token usage
    const usage = response.usage
    if (usage) {
      tokenTracker.trackUsage(
        usage.prompt_tokens,
        usage.completion_tokens,
        'gpt-4',
        `calendar-parse-${Date.now()}`
      )
    }

    // Parse and validate response
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new OpenAIError('No response content from OpenAI', 'no_content')
    }

    const parsedData = JSON.parse(content)
    
    // Convert date strings to Date objects
    if (parsedData.events) {
      parsedData.events = parsedData.events.map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }))
    }

    return {
      ...parsedData,
      metadata: {
        duration,
        tokens: usage?.total_tokens || 0,
        cost: usage ? tokenTracker.estimateCost(
          usage.prompt_tokens,
          usage.completion_tokens,
          'gpt-4'
        ) : 0
      }
    }
  } catch (error) {
    console.error('Calendar parsing error:', error)
    
    if (error instanceof OpenAIError) {
      throw error
    }
    
    if (error instanceof OpenAI.APIError) {
      throw new OpenAIError(
        `OpenAI API error: ${error.message}`,
        error.code || 'api_error',
        error.status,
        isRetryableError(error, DEFAULT_RETRY_CONFIG.retryableErrors)
      )
    }
    
    throw new OpenAIError(
      'Failed to parse calendar events',
      'parsing_failed',
      undefined,
      false
    )
  }
}

// Health check with retry
export async function checkOpenAIHealthWithRetry(): Promise<{
  healthy: boolean
  latency: number
  error?: string
}> {
  try {
    const startTime = Date.now()
    
    await retryableOpenAI.modelsList()
    
    const endTime = Date.now()
    const latency = endTime - startTime
    
    return {
      healthy: true,
      latency
    }
  } catch (error) {
    console.error('OpenAI health check failed:', error)
    
    return {
      healthy: false,
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Circuit breaker pattern for OpenAI requests
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private halfOpenMaxCalls = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN'
        this.failureCount = 0
      } else {
        throw new OpenAIError('Circuit breaker is OPEN', 'circuit_breaker_open')
      }
    }

    if (this.state === 'HALF_OPEN' && this.failureCount >= this.halfOpenMaxCalls) {
      throw new OpenAIError('Circuit breaker is HALF_OPEN with max calls reached', 'circuit_breaker_half_open')
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state
  }

  reset(): void {
    this.failureCount = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
  }
}

// Global circuit breaker instance
export const circuitBreaker = new CircuitBreaker()
