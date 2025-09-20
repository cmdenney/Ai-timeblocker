import { parseISO, addDays, addWeeks, addMonths, format, startOfDay, endOfDay, isSameDay, isAfter, isBefore, differenceInMinutes } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz'
import { z } from 'zod'
import OpenAI from 'openai'

// Core interfaces
export interface ParsedCalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  isAllDay: boolean
  recurrence?: {
    rule: string // RRULE format
    pattern: string // human readable
    endDate?: Date
    count?: number
  }
  location?: string
  description?: string
  confidence: number
  conflicts?: ConflictInfo[]
  metadata?: {
    source: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
    tags?: string[]
    estimatedDuration?: number // in minutes
  }
}

export interface ConflictInfo {
  type: 'overlap' | 'same_time' | 'travel_time' | 'insufficient_break' | 'energy_mismatch'
  conflictingEvent: string
  conflictingEventId?: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
  timeOverlap?: number // minutes of overlap
}

export interface ParsingResult {
  events: ParsedCalendarEvent[]
  message: string
  needsClarification: boolean
  clarificationQuestions: string[]
  suggestions: string[]
  warnings: string[]
  metadata: {
    totalEvents: number
    hasRecurrence: boolean
    timezone: string
    confidence: number
    processingTime: number
  }
}

export interface ExistingEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  location?: string
  isAllDay?: boolean
  recurrence?: string
}

// Validation schemas
const ConflictInfoSchema = z.object({
  type: z.enum(['overlap', 'same_time', 'travel_time', 'insufficient_break', 'energy_mismatch']),
  conflictingEvent: z.string(),
  conflictingEventId: z.string().optional(),
  suggestion: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  timeOverlap: z.number().optional()
})

const ParsedCalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  isAllDay: z.boolean(),
  recurrence: z.object({
    rule: z.string(),
    pattern: z.string(),
    endDate: z.date().optional(),
    count: z.number().optional()
  }).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
  conflicts: z.array(ConflictInfoSchema).optional(),
  metadata: z.object({
    source: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    category: z.enum(['work', 'personal', 'meeting', 'break', 'focus', 'other']).optional(),
    tags: z.array(z.string()).optional(),
    estimatedDuration: z.number().optional()
  }).optional()
})

const ParsingResultSchema = z.object({
  events: z.array(ParsedCalendarEventSchema),
  message: z.string(),
  needsClarification: z.boolean(),
  clarificationQuestions: z.array(z.string()),
  suggestions: z.array(z.string()),
  warnings: z.array(z.string()),
  metadata: z.object({
    totalEvents: z.number(),
    hasRecurrence: z.boolean(),
    timezone: z.string(),
    confidence: z.number(),
    processingTime: z.number()
  })
})

// Advanced Calendar NLP Parser
export class CalendarNLPParser {
  private openai: OpenAI
  private timezone: string
  private defaultDuration: number = 60 // minutes
  private travelTimeBuffer: number = 15 // minutes

  constructor(timezone: string = 'UTC') {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.timezone = timezone
  }

  async parseScheduleInput(
    input: string, 
    existingEvents: ExistingEvent[] = [],
    options: {
      context?: string
      userPreferences?: Record<string, any>
      workingHours?: { start: string; end: string }
    } = {}
  ): Promise<ParsingResult> {
    const startTime = Date.now()
    
    try {
      const systemPrompt = this.buildAdvancedSystemPrompt(existingEvents, options)
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this schedule request in timezone ${this.timezone}: "${input}"` }
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}')
      
      // Validate and enrich events
      const events = await this.validateAndEnrichEvents(parsed.events || [], existingEvents)
      
      // Detect conflicts
      const eventsWithConflicts = await this.detectConflicts(events, existingEvents)
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(eventsWithConflicts)
      
      const result: ParsingResult = {
        events: eventsWithConflicts,
        message: parsed.message || 'Events parsed successfully',
        needsClarification: parsed.needsClarification || false,
        clarificationQuestions: parsed.clarificationQuestions || [],
        suggestions: parsed.suggestions || [],
        warnings: parsed.warnings || [],
        metadata: {
          totalEvents: eventsWithConflicts.length,
          hasRecurrence: eventsWithConflicts.some(e => e.recurrence),
          timezone: this.timezone,
          confidence: overallConfidence,
          processingTime: Date.now() - startTime
        }
      }

      return result as ParsingResult
    } catch (error) {
      console.error('NLP parsing error:', error)
      throw new Error(`Failed to parse calendar input: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildAdvancedSystemPrompt(
    existingEvents: ExistingEvent[], 
    options: {
      context?: string
      userPreferences?: Record<string, any>
      workingHours?: { start: string; end: string }
    }
  ): string {
    const currentDate = new Date()
    const eventsList = existingEvents.map(e => 
      `- ${e.title}: ${format(e.startTime, 'MMM d, h:mm a')} - ${format(e.endTime, 'h:mm a')}${e.location ? ` (${e.location})` : ''}`
    ).join('\n')

    const workingHours = options.workingHours || { start: '09:00', end: '17:00' }
    const userPreferences = options.userPreferences || {}

    return `
You are an expert calendar assistant that parses natural language into structured calendar events with advanced conflict detection and timezone handling.

CURRENT TIMEZONE: ${this.timezone}
CURRENT DATE: ${format(currentDate, 'yyyy-MM-dd')}
CURRENT TIME: ${format(currentDate, 'HH:mm')}

EXISTING EVENTS:
${eventsList || 'No existing events'}

WORKING HOURS: ${workingHours.start} - ${workingHours.end}
USER PREFERENCES: ${JSON.stringify(userPreferences)}

Parse user input and extract calendar events with this JSON structure:
{
  "events": [
    {
      "id": "unique-event-id",
      "title": "string",
      "startDate": "ISO datetime string in user timezone",
      "endDate": "ISO datetime string in user timezone",
      "isAllDay": boolean,
      "recurrence": {
        "rule": "RRULE string",
        "pattern": "human readable description",
        "endDate": "ISO datetime string (optional)",
        "count": number (optional)
      },
      "location": "string or null",
      "description": "string or null",
      "confidence": 0.0-1.0,
      "conflicts": [
        {
          "type": "overlap|same_time|travel_time|insufficient_break|energy_mismatch",
          "conflictingEvent": "event title",
          "conflictingEventId": "event-id",
          "suggestion": "resolution suggestion",
          "severity": "low|medium|high",
          "timeOverlap": number (minutes)
        }
      ],
      "metadata": {
        "source": "user_input",
        "priority": "low|medium|high|urgent",
        "category": "work|personal|meeting|break|focus|other",
        "tags": ["tag1", "tag2"],
        "estimatedDuration": number (minutes)
      }
    }
  ],
  "message": "Human-friendly confirmation message",
  "needsClarification": boolean,
  "clarificationQuestions": ["question1", "question2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1", "warning2"]
}

ADVANCED PARSING RULES:

1. DATE/TIME HANDLING:
   - Handle relative dates: "today", "tomorrow", "next week", "this Friday"
   - Parse absolute dates: "January 15th", "Dec 25, 2024"
   - Recognize time patterns: "2:30 PM", "14:30", "quarter past 3"
   - Handle time ranges: "from 2 to 4 PM", "2-4 PM"
   - Default meeting duration: 1 hour if not specified
   - All-day events: "all day", "entire day", "whole day"

2. RECURRENCE PATTERNS:
   - "every day" → RRULE:FREQ=DAILY
   - "every Tuesday" → RRULE:FREQ=WEEKLY;BYDAY=TU
   - "every 2 weeks" → RRULE:FREQ=WEEKLY;INTERVAL=2
   - "monthly on the 15th" → RRULE:FREQ=MONTHLY;BYMONTHDAY=15
   - "weekdays" → RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
   - "every other Monday" → RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO
   - "first Monday of each month" → RRULE:FREQ=MONTHLY;BYDAY=1MO
   - "last Friday of the month" → RRULE:FREQ=MONTHLY;BYDAY=-1FR

3. LOCATION EXTRACTION:
   - "meeting at Starbucks" → location: "Starbucks"
   - "call from home" → location: "Home"
   - "conference room A" → location: "Conference Room A"
   - "Zoom meeting" → location: "Zoom"
   - "remote work" → location: "Remote"

4. CONFLICT DETECTION:
   - Check for overlapping times with existing events
   - Consider travel time between different locations (15-30 minutes)
   - Flag impossible schedules (overlapping or too close)
   - Detect energy mismatches (back-to-back intensive meetings)
   - Identify insufficient break time between events

5. PRIORITY AND CATEGORY DETECTION:
   - "urgent meeting" → priority: "urgent"
   - "important call" → priority: "high"
   - "optional check-in" → priority: "low"
   - "work meeting" → category: "work"
   - "personal time" → category: "personal"
   - "focus time" → category: "focus"
   - "break" → category: "break"

6. MULTIPLE EVENTS:
   - Handle multiple events in single input
   - "I have work at 2:30 on Tuesday, Wednesday, Thursday but 1:00 on Saturday and 12:00 on Sunday"
   - Create separate events for each occurrence
   - Maintain context across related events

7. TIMEZONE CONSIDERATIONS:
   - All dates should be in user's timezone
   - Convert to UTC for storage
   - Handle daylight saving time transitions
   - Consider user's working hours

8. CONFIDENCE SCORING:
   - 0.9-1.0: All details clear, no ambiguity
   - 0.7-0.8: Most details clear, minor ambiguity
   - 0.5-0.6: Some details unclear, needs clarification
   - 0.0-0.4: Highly ambiguous, requires user input

EXAMPLES:

Input: "I have work at 2:30 on Tuesday, Wednesday, Thursday but 1:00 on Saturday and 12:00 on Sunday"
Output: 5 separate work events with specified times, high confidence

Input: "Meeting with client every Monday at 9 AM for 2 hours"
Output: Recurring meeting with RRULE:FREQ=WEEKLY;BYDAY=MO, 2-hour duration

Input: "Gym session tomorrow at 6 PM"
Output: Single event for next day at 6 PM, 1-hour duration, category: "personal"

Input: "Urgent team standup daily at 9 AM for 30 minutes"
Output: Daily recurring meeting, 30-minute duration, priority: "urgent", category: "work"

Input: "Focus time every weekday from 2-4 PM"
Output: Recurring focus time, RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR, category: "focus"

Provide high confidence (0.8+) only when all details are clear.
Request clarification for ambiguous inputs.
Detect and report conflicts with existing events.
Suggest optimizations for better time management.
`
  }

  private async validateAndEnrichEvents(
    events: any[], 
    existingEvents: ExistingEvent[]
  ): Promise<ParsedCalendarEvent[]> {
    const validatedEvents: ParsedCalendarEvent[] = []

    for (const event of events) {
      try {
        // Validate required fields
        if (!event.title || !event.startDate || !event.endDate) {
          throw new Error('Missing required event fields')
        }

        // Parse and validate dates
        const startDate = parseISO(event.startDate)
        const endDate = parseISO(event.endDate)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format')
        }

        if (startDate >= endDate) {
          throw new Error('End date must be after start date')
        }

        // Generate unique ID if not provided
        const eventId = event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Enrich with metadata
        const enrichedEvent: ParsedCalendarEvent = {
          id: eventId,
          title: event.title,
          startDate,
          endDate,
          isAllDay: event.isAllDay || false,
          recurrence: event.recurrence ? {
            rule: event.recurrence.rule,
            pattern: event.recurrence.pattern,
            endDate: event.recurrence.endDate ? parseISO(event.recurrence.endDate) : undefined,
            count: event.recurrence.count
          } : undefined,
          location: event.location,
          description: event.description,
          confidence: Math.min(Math.max(event.confidence || 0, 0), 1),
          conflicts: event.conflicts || [],
          metadata: {
            source: 'user_input',
            priority: event.metadata?.priority || 'medium',
            category: event.metadata?.category || 'other',
            tags: event.metadata?.tags || [],
            estimatedDuration: differenceInMinutes(endDate, startDate)
          }
        }

        validatedEvents.push(enrichedEvent)
      } catch (error) {
        console.error('Error validating event:', error)
        // Continue with other events
      }
    }

    return validatedEvents
  }

  private async detectConflicts(
    events: ParsedCalendarEvent[], 
    existingEvents: ExistingEvent[]
  ): Promise<ParsedCalendarEvent[]> {
    const eventsWithConflicts = [...events]

    for (let i = 0; i < eventsWithConflicts.length; i++) {
      const event = eventsWithConflicts[i]
      const conflicts: ConflictInfo[] = []

      // Check conflicts with existing events
      for (const existingEvent of existingEvents) {
        const conflict = this.detectEventConflict(event, existingEvent)
        if (conflict) {
          conflicts.push(conflict)
        }
      }

      // Check conflicts with other parsed events
      for (let j = i + 1; j < eventsWithConflicts.length; j++) {
        const otherEvent = eventsWithConflicts[j]
        const conflict = this.detectEventConflict(event, {
          id: otherEvent.id,
          title: otherEvent.title,
          startTime: otherEvent.startDate,
          endTime: otherEvent.endDate,
          location: otherEvent.location,
          isAllDay: otherEvent.isAllDay
        })
        if (conflict) {
          conflicts.push(conflict)
        }
      }

      eventsWithConflicts[i] = {
        ...event,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      }
    }

    return eventsWithConflicts
  }

  private detectEventConflict(
    event1: ParsedCalendarEvent, 
    event2: ExistingEvent | ParsedCalendarEvent
  ): ConflictInfo | null {
    const start1 = event1.startDate
    const end1 = event1.endDate
    const start2 = 'startTime' in event2 ? event2.startTime : event2.startDate
    const end2 = 'endTime' in event2 ? event2.endTime : event2.endDate

    // Check for time overlap
    if (start1 < end2 && start2 < end1) {
      const overlapMinutes = Math.min(
        differenceInMinutes(end1, start2),
        differenceInMinutes(end2, start1)
      )

      let conflictType: ConflictInfo['type'] = 'overlap'
      let severity: ConflictInfo['severity'] = 'medium'
      let suggestion = ''

      if (overlapMinutes > 30) {
        severity = 'high'
        suggestion = 'Consider rescheduling one of these events to avoid major overlap'
      } else if (overlapMinutes > 15) {
        severity = 'medium'
        suggestion = 'These events have significant overlap. Consider adjusting times'
      } else {
        severity = 'low'
        suggestion = 'Minor overlap detected. Consider adding buffer time'
      }

      // Check for travel time conflicts
      if (event1.location && event2.location && event1.location !== event2.location) {
        conflictType = 'travel_time'
        suggestion += '. Also consider travel time between locations'
        severity = 'high'
      }

      // Check for same time conflicts
      if (start1.getTime() === start2.getTime()) {
        conflictType = 'same_time'
        suggestion = 'These events are scheduled at exactly the same time'
        severity = 'high'
      }

      return {
        type: conflictType,
        conflictingEvent: (event2 as any).title || 'Unknown Event',
        conflictingEventId: (event2 as any).id,
        suggestion,
        severity,
        timeOverlap: overlapMinutes
      }
    }

    // Check for insufficient break time
    const timeBetween = differenceInMinutes(start1, end2)
    if (timeBetween > 0 && timeBetween < this.travelTimeBuffer) {
      return {
        type: 'insufficient_break',
        conflictingEvent: (event2 as any).title || 'Unknown Event',
        conflictingEventId: (event2 as any).id,
        suggestion: `Only ${timeBetween} minutes between events. Consider adding more buffer time`,
        severity: 'medium',
        timeOverlap: timeBetween
      }
    }

    return null
  }

  private calculateOverallConfidence(events: ParsedCalendarEvent[]): number {
    if (events.length === 0) return 0

    const totalConfidence = events.reduce((sum, event) => sum + event.confidence, 0)
    const averageConfidence = totalConfidence / events.length

    // Reduce confidence if there are many conflicts
    const conflictPenalty = events.reduce((penalty, event) => {
      if (event.conflicts && event.conflicts.length > 0) {
        return penalty + (event.conflicts.length * 0.1)
      }
      return penalty
    }, 0)

    return Math.max(0, Math.min(1, averageConfidence - conflictPenalty))
  }

  // Advanced pattern recognition for complex scheduling
  async recognizePatterns(input: string): Promise<{
    hasRecurrence: boolean
    timePatterns: string[]
    locations: string[]
    priorities: string[]
    categories: string[]
    timeRanges: Array<{ start: string; end: string }>
  }> {
    const patterns = {
      recurrence: /\b(every|daily|weekly|monthly|yearly|recurring|repeat)\b/i,
      timeOfDay: /\b(\d{1,2}(:\d{2})?\s*(am|pm)?)\b/gi,
      days: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend|today|tomorrow)\b/gi,
      locations: /\b(at|in|from)\s+([A-Za-z\s]+?)(?:\s|$|,|\.)/gi,
      priorities: /\b(urgent|important|high priority|low priority|optional|critical)\b/gi,
      categories: /\b(work|personal|meeting|break|focus|gym|exercise|lunch|dinner|call|appointment)\b/gi,
      timeRanges: /\b(from\s+\d{1,2}(:\d{2})?\s*(am|pm)?\s+to\s+\d{1,2}(:\d{2})?\s*(am|pm)?|\d{1,2}(:\d{2})?\s*(am|pm)?\s*-\s*\d{1,2}(:\d{2})?\s*(am|pm)?)\b/gi
    }

    const timeRanges: Array<{ start: string; end: string }> = []
    const timeRangeMatches = input.match(patterns.timeRanges) || []
    
    for (const match of timeRangeMatches) {
      const rangeMatch = match.match(/(\d{1,2}(:\d{2})?\s*(am|pm)?)\s*(?:to|-)\s*(\d{1,2}(:\d{2})?\s*(am|pm)?)/i)
      if (rangeMatch) {
        timeRanges.push({
          start: rangeMatch[1].trim(),
          end: rangeMatch[4].trim()
        })
      }
    }

    return {
      hasRecurrence: patterns.recurrence.test(input),
      timePatterns: input.match(patterns.timeOfDay) || [],
      locations: this.extractLocations(input),
      priorities: input.match(patterns.priorities) || [],
      categories: input.match(patterns.categories) || [],
      timeRanges
    }
  }

  private extractLocations(input: string): string[] {
    const locationPatterns = [
      /\b(at|in|from)\s+([A-Za-z\s]+?)(?:\s|$|,|\.)/gi,
      /\b(conference room|meeting room|office|home|starbucks|coffee shop)\b/gi,
      /\b(zoom|teams|google meet|skype|call)\b/gi
    ]

    const locations: string[] = []
    
    for (const pattern of locationPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        locations.push(...matches.map(match => match.trim()))
      }
    }

    return [...new Set(locations)] // Remove duplicates
  }

  // Timezone utilities
  convertToTimezone(date: Date, timezone: string): Date {
    return utcToZonedTime(date, timezone)
  }

  convertFromTimezone(date: Date, timezone: string): Date {
    return zonedTimeToUtc(date, timezone)
  }

  formatInTimezone(date: Date, timezone: string, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
    return formatTz(date, formatStr, { timeZone: timezone })
  }

  // Recurrence pattern utilities
  generateRRULE(pattern: string): string {
    const patterns: Record<string, string> = {
      'every day': 'FREQ=DAILY',
      'daily': 'FREQ=DAILY',
      'every weekday': 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      'weekdays': 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      'every weekend': 'FREQ=WEEKLY;BYDAY=SA,SU',
      'weekends': 'FREQ=WEEKLY;BYDAY=SA,SU',
      'every Monday': 'FREQ=WEEKLY;BYDAY=MO',
      'every Tuesday': 'FREQ=WEEKLY;BYDAY=TU',
      'every Wednesday': 'FREQ=WEEKLY;BYDAY=WE',
      'every Thursday': 'FREQ=WEEKLY;BYDAY=TH',
      'every Friday': 'FREQ=WEEKLY;BYDAY=FR',
      'every Saturday': 'FREQ=WEEKLY;BYDAY=SA',
      'every Sunday': 'FREQ=WEEKLY;BYDAY=SU',
      'every week': 'FREQ=WEEKLY',
      'weekly': 'FREQ=WEEKLY',
      'every month': 'FREQ=MONTHLY',
      'monthly': 'FREQ=MONTHLY',
      'every year': 'FREQ=YEARLY',
      'yearly': 'FREQ=YEARLY'
    }

    return patterns[pattern.toLowerCase()] || 'FREQ=WEEKLY'
  }

  // Conflict resolution suggestions
  generateConflictResolutionSuggestions(conflicts: ConflictInfo[]): string[] {
    const suggestions: string[] = []

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'overlap':
          suggestions.push(`Reschedule "${conflict.conflictingEvent}" to avoid overlap`)
          break
        case 'same_time':
          suggestions.push(`Choose different times for these conflicting events`)
          break
        case 'travel_time':
          suggestions.push(`Consider travel time between locations or reschedule`)
          break
        case 'insufficient_break':
          suggestions.push(`Add more buffer time between events`)
          break
        case 'energy_mismatch':
          suggestions.push(`Consider scheduling less intensive activities together`)
          break
      }
    }

    return [...new Set(suggestions)] // Remove duplicates
  }
}

// Utility functions
export function createCalendarNLPParser(timezone: string = 'UTC'): CalendarNLPParser {
  return new CalendarNLPParser(timezone)
}

export function validateParsedEvent(event: any): ParsedCalendarEvent {  
  return event as ParsedCalendarEvent
}

export function validateParsingResult(result: any): ParsingResult {     
  return result as ParsingResult
}
