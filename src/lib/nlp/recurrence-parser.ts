import { addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, getDay, getDate, getMonth, getYear } from 'date-fns'
import { z } from 'zod'

// Recurrence rule interfaces
export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  byDay?: string[] // MO, TU, WE, TH, FR, SA, SU
  byMonthDay?: number[]
  byMonth?: number[]
  byYearDay?: number[]
  byWeekNo?: number[]
  bySetPos?: number[]
  count?: number
  until?: Date
  weekStart?: string // MO, TU, WE, TH, FR, SA, SU
}

export interface RecurrencePattern {
  rule: RecurrenceRule
  rrule: string // RFC 5545 RRULE format
  description: string // Human-readable description
  nextOccurrences: Date[] // Next few occurrences
}

export interface ParsedRecurrence {
  hasRecurrence: boolean
  pattern?: RecurrencePattern
  confidence: number
  suggestions: string[]
}

// Validation schemas
const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().min(1),
  byDay: z.array(z.string()).optional(),
  byMonthDay: z.array(z.number()).optional(),
  byMonth: z.array(z.number()).optional(),
  byYearDay: z.array(z.number()).optional(),
  byWeekNo: z.array(z.number()).optional(),
  bySetPos: z.array(z.number()).optional(),
  count: z.number().optional(),
  until: z.date().optional(),
  weekStart: z.string().optional()
})

const RecurrencePatternSchema = z.object({
  rule: RecurrenceRuleSchema,
  rrule: z.string(),
  description: z.string(),
  nextOccurrences: z.array(z.date())
})

const ParsedRecurrenceSchema = z.object({
  hasRecurrence: z.boolean(),
  pattern: RecurrencePatternSchema.optional(),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string())
})

// Recurrence pattern recognition class
export class RecurrenceParser {
  private baseDate: Date
  private timezone: string

  constructor(baseDate: Date = new Date(), timezone: string = 'UTC') {
    this.baseDate = baseDate
    this.timezone = timezone
  }

  // Parse recurrence from natural language
  parseRecurrence(input: string): ParsedRecurrence {
    const lowerInput = input.toLowerCase().trim()
    
    // Check if input contains recurrence indicators
    const recurrenceIndicators = [
      'every', 'daily', 'weekly', 'monthly', 'yearly',
      'recurring', 'repeat', 'regular', 'routine',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'weekday', 'weekend', 'first', 'last', 'second', 'third', 'fourth'
    ]

    const hasRecurrence = recurrenceIndicators.some(indicator => 
      lowerInput.includes(indicator)
    )

    if (!hasRecurrence) {
      return {
        hasRecurrence: false,
        confidence: 0.9,
        suggestions: []
      }
    }

    try {
      const pattern = this.identifyRecurrencePattern(lowerInput)
      const rrule = this.generateRRULE(pattern.rule)
      const description = this.generateDescription(pattern.rule)
      const nextOccurrences = this.generateNextOccurrences(pattern.rule, 5)

      return {
        hasRecurrence: true,
        pattern: {
          rule: pattern.rule,
          rrule,
          description,
          nextOccurrences
        },
        confidence: pattern.confidence,
        suggestions: pattern.suggestions
      }
    } catch (error) {
      console.error('Error parsing recurrence:', error)
      return {
        hasRecurrence: true,
        confidence: 0.3,
        suggestions: ['Could not parse recurrence pattern. Please be more specific.']
      }
    }
  }

  // Identify recurrence pattern from input
  private identifyRecurrencePattern(input: string): {
    rule: RecurrenceRule
    confidence: number
    suggestions: string[]
  } {
    const suggestions: string[] = []
    let confidence = 0.8

    // Daily patterns
    if (input.includes('every day') || input.includes('daily')) {
      const interval = this.extractInterval(input, 1)
      return {
        rule: {
          frequency: 'DAILY',
          interval,
          count: this.extractCount(input)
        },
        confidence: 0.9,
        suggestions: []
      }
    }

    // Weekly patterns
    if (input.includes('every week') || input.includes('weekly')) {
      const interval = this.extractInterval(input, 1)
      const byDay = this.extractDaysOfWeek(input)
      
      return {
        rule: {
          frequency: 'WEEKLY',
          interval,
          byDay: byDay.length > 0 ? byDay : undefined,
          count: this.extractCount(input)
        },
        confidence: byDay.length > 0 ? 0.9 : 0.7,
        suggestions: byDay.length === 0 ? ['Consider specifying which days of the week'] : []
      }
    }

    // Monthly patterns
    if (input.includes('every month') || input.includes('monthly')) {
      const interval = this.extractInterval(input, 1)
      const byMonthDay = this.extractMonthDay(input)
      const byDay = this.extractDaysOfWeek(input)
      
      return {
        rule: {
          frequency: 'MONTHLY',
          interval,
          byMonthDay: byMonthDay.length > 0 ? byMonthDay : undefined,
          byDay: byDay.length > 0 ? byDay : undefined,
          bySetPos: this.extractSetPosition(input),
          count: this.extractCount(input)
        },
        confidence: (byMonthDay.length > 0 || byDay.length > 0) ? 0.9 : 0.7,
        suggestions: (byMonthDay.length === 0 && byDay.length === 0) ? 
          ['Consider specifying which day of the month or week'] : []
      }
    }

    // Yearly patterns
    if (input.includes('every year') || input.includes('yearly')) {
      const interval = this.extractInterval(input, 1)
      
      return {
        rule: {
          frequency: 'YEARLY',
          interval,
          count: this.extractCount(input)
        },
        confidence: 0.9,
        suggestions: []
      }
    }

    // Day-specific patterns
    const dayPatterns = this.extractDaySpecificPatterns(input)
    if (dayPatterns.length > 0) {
      const interval = this.extractInterval(input, 1)
      
      return {
        rule: {
          frequency: 'WEEKLY',
          interval,
          byDay: dayPatterns,
          count: this.extractCount(input)
        },
        confidence: 0.9,
        suggestions: []
      }
    }

    // Weekday/Weekend patterns
    if (input.includes('weekday') || input.includes('weekdays')) {
      const interval = this.extractInterval(input, 1)
      
      return {
        rule: {
          frequency: 'WEEKLY',
          interval,
          byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
          count: this.extractCount(input)
        },
        confidence: 0.9,
        suggestions: []
      }
    }

    if (input.includes('weekend') || input.includes('weekends')) {
      const interval = this.extractInterval(input, 1)
      
      return {
        rule: {
          frequency: 'WEEKLY',
          interval,
          byDay: ['SA', 'SU'],
          count: this.extractCount(input)
        },
        confidence: 0.9,
        suggestions: []
      }
    }

    // Default to weekly if unclear
    return {
      rule: {
        frequency: 'WEEKLY',
        interval: 1,
        count: this.extractCount(input)
      },
      confidence: 0.5,
      suggestions: ['Could not determine specific recurrence pattern. Defaulting to weekly.']
    }
  }

  // Extract interval from input (e.g., "every 2 weeks" -> 2)
  private extractInterval(input: string, defaultInterval: number): number {
    const intervalPattern = /every\s+(\d+)\s+(day|week|month|year)/i
    const match = input.match(intervalPattern)
    
    if (match) {
      return parseInt(match[1])
    }

    const numberPattern = /(\d+)\s+(day|week|month|year)/i
    const numberMatch = input.match(numberPattern)
    
    if (numberMatch) {
      return parseInt(numberMatch[1])
    }

    return defaultInterval
  }

  // Extract count from input (e.g., "for 5 times" -> 5)
  private extractCount(input: string): number | undefined {
    const countPattern = /(?:for|repeat)\s+(\d+)\s+times?/i
    const match = input.match(countPattern)
    
    if (match) {
      return parseInt(match[1])
    }

    return undefined
  }

  // Extract days of week from input
  private extractDaysOfWeek(input: string): string[] {
    const dayMap: Record<string, string> = {
      'monday': 'MO',
      'tuesday': 'TU',
      'wednesday': 'WE',
      'thursday': 'TH',
      'friday': 'FR',
      'saturday': 'SA',
      'sunday': 'SU'
    }

    const days: string[] = []
    
    for (const [dayName, dayCode] of Object.entries(dayMap)) {
      if (input.includes(dayName)) {
        days.push(dayCode)
      }
    }

    return days
  }

  // Extract month day from input (e.g., "on the 15th" -> [15])
  private extractMonthDay(input: string): number[] {
    const dayPattern = /(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?/i
    const match = input.match(dayPattern)
    
    if (match) {
      const day = parseInt(match[1])
      if (day >= 1 && day <= 31) {
        return [day]
      }
    }

    return []
  }

  // Extract set position from input (e.g., "first Monday" -> [1])
  private extractSetPosition(input: string): number[] | undefined {
    const positionMap: Record<string, number> = {
      'first': 1,
      'second': 2,
      'third': 3,
      'fourth': 4,
      'last': -1
    }

    for (const [position, value] of Object.entries(positionMap)) {
      if (input.includes(position)) {
        return [value]
      }
    }

    return undefined
  }

  // Extract day-specific patterns (e.g., "every Tuesday and Thursday")
  private extractDaySpecificPatterns(input: string): string[] {
    const dayPatterns = [
      { pattern: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] },
      { pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+and\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] }
    ]

    const days: string[] = []

    for (const { pattern, days: dayCodes } of dayPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        for (const match of matches) {
          const dayName = match.toLowerCase().replace(/every\s+|and\s+/g, '').trim()
          const dayCode = dayCodes.find(code => 
            dayName.includes(code.toLowerCase().replace('mo', 'monday').replace('tu', 'tuesday').replace('we', 'wednesday').replace('th', 'thursday').replace('fr', 'friday').replace('sa', 'saturday').replace('su', 'sunday'))
          )
          if (dayCode) {
            days.push(dayCode)
          }
        }
      }
    }

    return [...new Set(days)] // Remove duplicates
  }

  // Generate RRULE string from RecurrenceRule
  private generateRRULE(rule: RecurrenceRule): string {
    const parts: string[] = []
    
    parts.push(`FREQ=${rule.frequency}`)
    
    if (rule.interval > 1) {
      parts.push(`INTERVAL=${rule.interval}`)
    }
    
    if (rule.byDay && rule.byDay.length > 0) {
      parts.push(`BYDAY=${rule.byDay.join(',')}`)
    }
    
    if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`)
    }
    
    if (rule.byMonth && rule.byMonth.length > 0) {
      parts.push(`BYMONTH=${rule.byMonth.join(',')}`)
    }
    
    if (rule.byYearDay && rule.byYearDay.length > 0) {
      parts.push(`BYYEARDAY=${rule.byYearDay.join(',')}`)
    }
    
    if (rule.byWeekNo && rule.byWeekNo.length > 0) {
      parts.push(`BYWEEKNO=${rule.byWeekNo.join(',')}`)
    }
    
    if (rule.bySetPos && rule.bySetPos.length > 0) {
      parts.push(`BYSETPOS=${rule.bySetPos.join(',')}`)
    }
    
    if (rule.count) {
      parts.push(`COUNT=${rule.count}`)
    }
    
    if (rule.until) {
      parts.push(`UNTIL=${rule.until.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`)
    }
    
    if (rule.weekStart) {
      parts.push(`WKST=${rule.weekStart}`)
    }

    return parts.join(';')
  }

  // Generate human-readable description
  private generateDescription(rule: RecurrenceRule): string {
    const parts: string[] = []
    
    // Frequency and interval
    if (rule.interval === 1) {
      parts.push(`Every ${rule.frequency.toLowerCase()}`)
    } else {
      parts.push(`Every ${rule.interval} ${rule.frequency.toLowerCase()}s`)
    }
    
    // Days of week
    if (rule.byDay && rule.byDay.length > 0) {
      const dayNames = rule.byDay.map(day => {
        const dayMap: Record<string, string> = {
          'MO': 'Monday',
          'TU': 'Tuesday',
          'WE': 'Wednesday',
          'TH': 'Thursday',
          'FR': 'Friday',
          'SA': 'Saturday',
          'SU': 'Sunday'
        }
        return dayMap[day] || day
      })
      
      if (dayNames.length === 1) {
        parts.push(`on ${dayNames[0]}`)
      } else if (dayNames.length === 2) {
        parts.push(`on ${dayNames.join(' and ')}`)
      } else {
        parts.push(`on ${dayNames.slice(0, -1).join(', ')} and ${dayNames[dayNames.length - 1]}`)
      }
    }
    
    // Month day
    if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      const day = rule.byMonthDay[0]
      const suffix = this.getOrdinalSuffix(day)
      parts.push(`on the ${day}${suffix}`)
    }
    
    // Set position
    if (rule.bySetPos && rule.bySetPos.length > 0) {
      const pos = rule.bySetPos[0]
      const positionNames: Record<number, string> = {
        1: 'first',
        2: 'second',
        3: 'third',
        4: 'fourth',
        '-1': 'last'
      }
      parts.push(`on the ${positionNames[pos] || pos}`)
    }
    
    // Count
    if (rule.count) {
      parts.push(`for ${rule.count} times`)
    }
    
    // Until
    if (rule.until) {
      parts.push(`until ${rule.until.toLocaleDateString()}`)
    }

    return parts.join(' ')
  }

  // Get ordinal suffix for numbers
  private getOrdinalSuffix(num: number): string {
    const lastDigit = num % 10
    const lastTwoDigits = num % 100
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th'
    }
    
    switch (lastDigit) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  // Generate next occurrences
  private generateNextOccurrences(rule: RecurrenceRule, count: number): Date[] {
    const occurrences: Date[] = []
    let currentDate = new Date(this.baseDate)
    
    for (let i = 0; i < count; i++) {
      const nextOccurrence = this.getNextOccurrence(rule, currentDate)
      if (nextOccurrence) {
        occurrences.push(nextOccurrence)
        currentDate = new Date(nextOccurrence.getTime() + 24 * 60 * 60 * 1000) // Move to next day
      } else {
        break
      }
    }
    
    return occurrences
  }

  // Get next occurrence based on rule
  private getNextOccurrence(rule: RecurrenceRule, fromDate: Date): Date | null {
    const currentDate = new Date(fromDate)
    
    switch (rule.frequency) {
      case 'DAILY':
        return addDays(currentDate, rule.interval)
      
      case 'WEEKLY':
        if (rule.byDay && rule.byDay.length > 0) {
          return this.getNextWeeklyOccurrence(rule, currentDate)
        }
        return addWeeks(currentDate, rule.interval)
      
      case 'MONTHLY':
        if (rule.byMonthDay && rule.byMonthDay.length > 0) {
          return this.getNextMonthlyOccurrence(rule, currentDate)
        }
        return addMonths(currentDate, rule.interval)
      
      case 'YEARLY':
        return addYears(currentDate, rule.interval)
      
      default:
        return null
    }
  }

  // Get next weekly occurrence
  private getNextWeeklyOccurrence(rule: RecurrenceRule, fromDate: Date): Date | null {
    if (!rule.byDay || rule.byDay.length === 0) return null
    
    const dayMap: Record<string, number> = {
      'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6, 'SU': 0
    }
    
    const targetDays = rule.byDay.map(day => dayMap[day]).filter(day => day !== undefined)
    if (targetDays.length === 0) return null
    
    const currentDay = fromDate.getDay()
    const nextDays = targetDays.filter(day => day > currentDay)
    
    if (nextDays.length > 0) {
      const nextDay = Math.min(...nextDays)
      const daysToAdd = nextDay - currentDay
      return addDays(fromDate, daysToAdd)
    } else {
      // Next week
      const nextDay = Math.min(...targetDays)
      const daysToAdd = 7 - currentDay + nextDay
      return addDays(fromDate, daysToAdd)
    }
  }

  // Get next monthly occurrence
  private getNextMonthlyOccurrence(rule: RecurrenceRule, fromDate: Date): Date | null {
    if (!rule.byMonthDay || rule.byMonthDay.length === 0) return null
    
    const targetDay = rule.byMonthDay[0]
    const currentDate = fromDate.getDate()
    
    if (targetDay > currentDate) {
      // This month
      const nextDate = new Date(fromDate)
      nextDate.setDate(targetDay)
      return nextDate
    } else {
      // Next month
      const nextMonth = addMonths(fromDate, 1)
      const nextDate = new Date(nextMonth)
      nextDate.setDate(targetDay)
      return nextDate
    }
  }
}

// Utility functions
export function createRecurrenceParser(baseDate: Date = new Date(), timezone: string = 'UTC'): RecurrenceParser {
  return new RecurrenceParser(baseDate, timezone)
}

export function validateRecurrenceRule(rule: any): RecurrenceRule {     
  return rule as RecurrenceRule
}

export function validateRecurrencePattern(pattern: any): RecurrencePattern {                                                                            
  return pattern as RecurrencePattern
}

export function validateParsedRecurrence(parsed: any): ParsedRecurrence {
  return parsed as ParsedRecurrence
}
