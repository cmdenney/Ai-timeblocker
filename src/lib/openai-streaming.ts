import OpenAI from 'openai'
import { openai } from './openai'

// Types for streaming responses
export interface StreamMessage {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  metadata?: {
    tokens?: number
    model?: string
    finishReason?: string
  }
}

export interface StreamResponse {
  message: StreamMessage
  isComplete: boolean
  error?: string
}

// Chat completion with streaming
export async function* createStreamingChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  } = {}
): AsyncGenerator<StreamResponse, void, unknown> {
  const {
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 1000,
    systemPrompt
  } = options

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    })

    let fullContent = ''
    let tokenCount = 0

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      const finishReason = chunk.choices[0]?.finish_reason
      
      if (content) {
        fullContent += content
        tokenCount++
        
        yield {
          message: {
            id: `stream-${Date.now()}`,
            content: fullContent,
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              tokens: tokenCount,
              model,
              finishReason
            }
          },
          isComplete: false
        }
      }

      if (finishReason) {
        yield {
          message: {
            id: `stream-${Date.now()}`,
            content: fullContent,
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              tokens: tokenCount,
              model,
              finishReason
            }
          },
          isComplete: true
        }
        break
      }
    }
  } catch (error) {
    console.error('Streaming chat error:', error)
    yield {
      message: {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your request.',
        role: 'assistant',
        timestamp: new Date()
      },
      isComplete: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Calendar-specific streaming chat
export async function* createCalendarStreamingChat(
  userInput: string,
  context: {
    timezone: string
    currentDate: Date
    workingHours: { start: string; end: string }
    existingEvents: Array<{ title: string; startTime: Date; endTime: Date }>
    userPreferences: Record<string, any>
  }
): AsyncGenerator<StreamResponse, void, unknown> {
  const systemPrompt = `You are an AI assistant specialized in calendar management and time blocking. Help users create, modify, and optimize their schedules.

Current context:
- Timezone: ${context.timezone}
- Current date: ${context.currentDate.toISOString()}
- Working hours: ${JSON.stringify(context.workingHours)}
- Existing events: ${JSON.stringify(context.existingEvents)}
- User preferences: ${JSON.stringify(context.userPreferences)}

Provide helpful, actionable responses about calendar management, time blocking, and productivity optimization.`

  const messages = [
    { role: 'user' as const, content: userInput }
  ]

  yield* createStreamingChat(messages, {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1500,
    systemPrompt
  })
}

// Function calling with streaming for calendar operations
export async function* createFunctionCallingStream(
  userInput: string,
  functions: Array<{
    name: string
    description: string
    parameters: Record<string, any>
  }>,
  context: {
    timezone: string
    currentDate: Date
    workingHours: { start: string; end: string }
  }
): AsyncGenerator<StreamResponse, void, unknown> {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a calendar assistant. Use the provided functions to help users manage their calendar.

Context:
- Timezone: ${context.timezone}
- Current date: ${context.currentDate.toISOString()}
- Working hours: ${JSON.stringify(context.workingHours)}

Available functions: ${functions.map(f => f.name).join(', ')}`
        },
        { role: 'user', content: userInput }
      ],
      functions,
      function_call: 'auto',
      temperature: 0.3,
      stream: true,
    })

    let fullContent = ''
    let functionCall: any = null

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      const delta = chunk.choices[0]?.delta
      
      if (content) {
        fullContent += content
        yield {
          message: {
            id: `stream-${Date.now()}`,
            content: fullContent,
            role: 'assistant',
            timestamp: new Date()
          },
          isComplete: false
        }
      }

      if (delta?.function_call) {
        if (!functionCall) {
          functionCall = {
            name: delta.function_call.name || '',
            arguments: ''
          }
        }
        
        if (delta.function_call.arguments) {
          functionCall.arguments += delta.function_call.arguments
        }
      }

      if (chunk.choices[0]?.finish_reason === 'function_call') {
        yield {
          message: {
            id: `function-${Date.now()}`,
            content: fullContent,
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              functionCall
            } as any
          },
          isComplete: true
        }
        break
      }
    }
  } catch (error) {
    console.error('Function calling stream error:', error)
    yield {
      message: {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your request.',
        role: 'assistant',
        timestamp: new Date()
      },
      isComplete: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
