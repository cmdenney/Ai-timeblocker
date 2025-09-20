import OpenAI from 'openai'
import { z } from 'zod'

// Initialize OpenAI client with error handling
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
})

// Types for calendar event parsing
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

export interface ParsedResponse {
  events: ParsedEvent[]
  message: string
  suggestions?: string[]
  conflicts?: {
    type: 'overlap' | 'insufficient_break' | 'energy_mismatch'
    description: string
    severity: 'low' | 'medium' | 'high'
  }[]
}

// Zod schema for response validation
const ParsedEventSchema = z.object({
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isAllDay: z.boolean(),
  recurrence: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
  category: z.enum(['work', 'personal', 'meeting', 'break', 'focus', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
})

const ParsedResponseSchema = z.object({
  events: z.array(ParsedEventSchema),
  message: z.string(),
  suggestions: z.array(z.string()).optional(),
  conflicts: z.array(z.object({
    type: z.enum(['overlap', 'insufficient_break', 'energy_mismatch']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })).optional(),
})

// Prompt engineering for calendar parsing
export const CALENDAR_PARSING_PROMPT = `
You are an AI assistant specialized in parsing natural language into calendar events for the AI TimeBlocker application.

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
- Handle relative dates (today, tomorrow, next week, next Monday, etc.)
- Parse recurrence patterns into RRULE format
- Provide confidence score based on clarity (0.0-1.0)
- Categorize events appropriately
- Assign priority based on urgency indicators
- Detect conflicts and overlapping events
- Suggest optimizations for time management
- Use 24-hour format for times unless specified otherwise
- Handle timezone conversions properly
- Parse natural language durations (30 minutes, 2 hours, half day, etc.)
- Recognize meeting types and suggest appropriate durations
- Identify break times and personal time
- Suggest focus blocks for deep work
`

// Enhanced prompt for context-aware parsing
export const CONTEXT_AWARE_PROMPT = `
You are an AI assistant specialized in parsing natural language into calendar events with full context awareness.

Current context:
- User's timezone: {timezone}
- Current date: {currentDate}
- Working hours: {workingHours}
- Existing events: {existingEvents}
- User preferences: {preferences}

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

Additional rules:
- Consider user's working hours when scheduling
- Avoid conflicts with existing events
- Suggest optimal times based on user patterns
- Recommend breaks between intensive sessions
- Consider energy levels for different types of work
- Suggest buffer time for meetings
- Optimize for productivity patterns
`

// Parse calendar events from natural language
export async function parseCalendarEvents(
  userInput: string, 
  timezone: string = 'UTC',
  context?: {
    currentDate?: Date
    workingHours?: { start: string; end: string }
    existingEvents?: Array<{ title: string; startTime: Date; endTime: Date }>
    preferences?: Record<string, any>
  }
): Promise<ParsedResponse> {
  try {
    const currentDate = context?.currentDate || new Date()
    const workingHours = context?.workingHours || { start: '09:00', end: '17:00' }
    const existingEvents = context?.existingEvents || []
    const preferences = context?.preferences || {}

    // Use context-aware prompt if context is provided
    const systemPrompt = context 
      ? CONTEXT_AWARE_PROMPT
          .replace('{timezone}', timezone)
          .replace('{currentDate}', currentDate.toISOString())
          .replace('{workingHours}', JSON.stringify(workingHours))
          .replace('{existingEvents}', JSON.stringify(existingEvents))
          .replace('{preferences}', JSON.stringify(preferences))
      : CALENDAR_PARSING_PROMPT

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this calendar request (timezone: ${timezone}): "${userInput}"` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse and validate response
    const parsedData = JSON.parse(content)
    const validatedData = ParsedResponseSchema.parse(parsedData)

    // Convert date strings to Date objects
    const events: ParsedEvent[] = validatedData.events.map(event => ({  
      title: event.title || 'Untitled Event',
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      isAllDay: event.isAllDay || false,
      confidence: event.confidence || 0.5,
      description: event.description,
      location: event.location,
      recurrence: event.recurrence,
      category: event.category,
      priority: event.priority,
    }))

    return {
      events,
      message: validatedData.message || 'Events parsed successfully',
      suggestions: validatedData.suggestions || [],
      conflicts: (validatedData.conflicts || []).map(conflict => ({
        type: conflict.type || 'overlap',
        description: conflict.description || 'Unknown conflict',
        severity: conflict.severity || 'medium',
      })),
    }
  } catch (error) {
    console.error('OpenAI parsing error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      throw new Error('Invalid response format from OpenAI')
    }
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API error:', error.status, error.message)
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    
    throw new Error('Failed to parse calendar events')
  }
}

// Generate calendar suggestions
export async function generateCalendarSuggestions(
  userInput: string,
  context: {
    timezone: string
    currentDate: Date
    workingHours: { start: string; end: string }
    existingEvents: Array<{ title: string; startTime: Date; endTime: Date }>
    userPreferences: Record<string, any>
  }
): Promise<{
  suggestions: string[]
  optimizations: string[]
  conflicts: Array<{
    type: string
    description: string
    severity: string
  }>
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a calendar optimization assistant. Analyze the user's request and provide suggestions for better time management.

Context:
- Timezone: ${context.timezone}
- Current date: ${context.currentDate.toISOString()}
- Working hours: ${JSON.stringify(context.workingHours)}
- Existing events: ${JSON.stringify(context.existingEvents)}
- User preferences: ${JSON.stringify(context.userPreferences)}

Provide suggestions in this JSON format:
{
  "suggestions": ["suggestion1", "suggestion2"],
  "optimizations": ["optimization1", "optimization2"],
  "conflicts": [
    {
      "type": "overlap|insufficient_break|energy_mismatch",
      "description": "conflict description",
      "severity": "low|medium|high"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analyze this calendar request and provide suggestions: "${userInput}"`
        }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI suggestions error:', error)
    throw new Error('Failed to generate calendar suggestions')
  }
}

// Health check for OpenAI API
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    await openai.models.list()
    return true
  } catch (error) {
    console.error('OpenAI health check failed:', error)
    return false
  }
}
