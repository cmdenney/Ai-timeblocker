import { differenceInMinutes, isAfter, isBefore, isSameDay } from 'date-fns'
import { z } from 'zod'

// Confidence scoring interfaces
export interface ConfidenceFactors {
  timeClarity: number // 0-1, how clear the time specification is
  dateClarity: number // 0-1, how clear the date specification is
  locationClarity: number // 0-1, how clear the location is
  titleClarity: number // 0-1, how clear the event title is
  contextRelevance: number // 0-1, how relevant to calendar context
  ambiguityLevel: number // 0-1, how ambiguous the input is
  completeness: number // 0-1, how complete the event information is
  consistency: number // 0-1, how consistent with user patterns
}

export interface ConfidenceScore {
  overall: number // 0-1, overall confidence score
  factors: ConfidenceFactors
  breakdown: {
    timeScore: number
    dateScore: number
    locationScore: number
    titleScore: number
    contextScore: number
    ambiguityScore: number
    completenessScore: number
    consistencyScore: number
  }
  suggestions: string[]
  warnings: string[]
}

export interface ParsedEvent {
  title: string
  startDate: Date
  endDate: Date
  isAllDay: boolean
  location?: string
  description?: string
  recurrence?: {
    rule: string
    pattern: string
  }
  metadata?: {
    source: string
    priority?: string
    category?: string
    tags?: string[]
  }
}

export interface UserPatterns {
  preferredTimes: string[] // e.g., ['09:00', '14:00']
  preferredDays: string[] // e.g., ['Monday', 'Tuesday']
  commonLocations: string[] // e.g., ['Office', 'Home']
  eventCategories: string[] // e.g., ['work', 'personal']
  averageDuration: number // in minutes
  workingHours: { start: string; end: string }
}

// Validation schemas
const ConfidenceFactorsSchema = z.object({
  timeClarity: z.number().min(0).max(1),
  dateClarity: z.number().min(0).max(1),
  locationClarity: z.number().min(0).max(1),
  titleClarity: z.number().min(0).max(1),
  contextRelevance: z.number().min(0).max(1),
  ambiguityLevel: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  consistency: z.number().min(0).max(1)
})

const ConfidenceScoreSchema = z.object({
  overall: z.number().min(0).max(1),
  factors: ConfidenceFactorsSchema,
  breakdown: z.object({
    timeScore: z.number().min(0).max(1),
    dateScore: z.number().min(0).max(1),
    locationScore: z.number().min(0).max(1),
    titleScore: z.number().min(0).max(1),
    contextScore: z.number().min(0).max(1),
    ambiguityScore: z.number().min(0).max(1),
    completenessScore: z.number().min(0).max(1),
    consistencyScore: z.number().min(0).max(1)
  }),
  suggestions: z.array(z.string()),
  warnings: z.array(z.string())
})

// Confidence scorer class
export class ConfidenceScorer {
  private userPatterns: UserPatterns
  private contextEvents: ParsedEvent[]

  constructor(userPatterns: UserPatterns, contextEvents: ParsedEvent[] = []) {
    this.userPatterns = userPatterns
    this.contextEvents = contextEvents
  }

  // Calculate confidence score for a parsed event
  calculateConfidence(event: ParsedEvent, originalInput: string): ConfidenceScore {
    const factors = this.analyzeConfidenceFactors(event, originalInput)
    const breakdown = this.calculateBreakdown(factors)
    const overall = this.calculateOverallScore(breakdown)
    const suggestions = this.generateSuggestions(factors, breakdown)
    const warnings = this.generateWarnings(factors, breakdown)

    return {
      overall,
      factors,
      breakdown,
      suggestions,
      warnings
    }
  }

  // Analyze confidence factors
  private analyzeConfidenceFactors(event: ParsedEvent, originalInput: string): ConfidenceFactors {
    return {
      timeClarity: this.analyzeTimeClarity(event, originalInput),
      dateClarity: this.analyzeDateClarity(event, originalInput),
      locationClarity: this.analyzeLocationClarity(event, originalInput),
      titleClarity: this.analyzeTitleClarity(event, originalInput),
      contextRelevance: this.analyzeContextRelevance(event),
      ambiguityLevel: this.analyzeAmbiguityLevel(originalInput),
      completeness: this.analyzeCompleteness(event),
      consistency: this.analyzeConsistency(event)
    }
  }

  // Analyze time clarity
  private analyzeTimeClarity(event: ParsedEvent, originalInput: string): number {
    let score = 0.5 // Base score

    // Check if time is explicitly specified
    const timePatterns = [
      /\d{1,2}:\d{2}\s*(am|pm)/i,
      /\d{1,2}\s*(am|pm)/i,
      /\d{1,2}:\d{2}/i,
      /at\s+\d{1,2}/i,
      /from\s+\d{1,2}/i,
      /until\s+\d{1,2}/i
    ]

    const hasExplicitTime = timePatterns.some(pattern => pattern.test(originalInput))
    if (hasExplicitTime) score += 0.3

    // Check if duration is specified
    const durationPatterns = [
      /for\s+\d+\s+(hour|minute|hr|min)/i,
      /lasting\s+\d+/i,
      /\d+\s+(hour|minute|hr|min)/i
    ]

    const hasExplicitDuration = durationPatterns.some(pattern => pattern.test(originalInput))
    if (hasExplicitDuration) score += 0.2

    // Check if time is reasonable
    const startHour = event.startDate.getHours()
    const endHour = event.endDate.getHours()
    const duration = differenceInMinutes(event.endDate, event.startDate)

    if (startHour >= 6 && startHour <= 22) score += 0.1 // Reasonable hours
    if (duration >= 15 && duration <= 480) score += 0.1 // Reasonable duration

    return Math.min(1, score)
  }

  // Analyze date clarity
  private analyzeDateClarity(event: ParsedEvent, originalInput: string): number {
    let score = 0.5 // Base score

    // Check if date is explicitly specified
    const datePatterns = [
      /\b(today|tomorrow|yesterday)\b/i,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      /\d{1,2}\/\d{1,2}\/\d{4}/,
      /\d{4}-\d{2}-\d{2}/,
      /\d{1,2}\s+(st|nd|rd|th)/i
    ]

    const hasExplicitDate = datePatterns.some(pattern => pattern.test(originalInput))
    if (hasExplicitDate) score += 0.3

    // Check if date is in the future
    const now = new Date()
    if (event.startDate > now) score += 0.2

    // Check if date is not too far in the future
    const daysFromNow = Math.ceil((event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysFromNow <= 365) score += 0.1 // Within a year

    return Math.min(1, score)
  }

  // Analyze location clarity
  private analyzeLocationClarity(event: ParsedEvent, originalInput: string): number {
    let score = 0.5 // Base score

    // Check if location is specified
    if (event.location && event.location.trim().length > 0) {
      score += 0.3

      // Check if location is specific
      const specificLocationPatterns = [
        /room\s+\w+/i,
        /building\s+\w+/i,
        /address/i,
        /street/i,
        /avenue/i,
        /road/i
      ]

      const isSpecificLocation = specificLocationPatterns.some(pattern => 
        pattern.test(event.location!)
      )
      if (isSpecificLocation) score += 0.2
    }

    // Check if location matches user patterns
    if (event.location && this.userPatterns.commonLocations.includes(event.location)) {
      score += 0.2
    }

    return Math.min(1, score)
  }

  // Analyze title clarity
  private analyzeTitleClarity(event: ParsedEvent, originalInput: string): number {
    let score = 0.5 // Base score

    // Check if title is descriptive
    if (event.title && event.title.trim().length > 3) {
      score += 0.2

      // Check if title contains action words
      const actionWords = [
        'meeting', 'call', 'appointment', 'session', 'work', 'lunch', 'dinner',
        'gym', 'exercise', 'break', 'focus', 'study', 'read', 'write'
      ]

      const hasActionWord = actionWords.some(word => 
        event.title.toLowerCase().includes(word)
      )
      if (hasActionWord) score += 0.2

      // Check if title is not too generic
      const genericTitles = ['event', 'thing', 'stuff', 'meeting', 'call']
      const isGeneric = genericTitles.includes(event.title.toLowerCase())
      if (!isGeneric) score += 0.1
    }

    return Math.min(1, score)
  }

  // Analyze context relevance
  private analyzeContextRelevance(event: ParsedEvent): number {
    let score = 0.5 // Base score

    // Check if event fits user's working hours
    const startHour = event.startDate.getHours()
    const workingStart = parseInt(this.userPatterns.workingHours.start.split(':')[0])
    const workingEnd = parseInt(this.userPatterns.workingHours.end.split(':')[0])

    if (startHour >= workingStart && startHour <= workingEnd) {
      score += 0.2
    }

    // Check if event category matches user patterns
    if (event.metadata?.category && 
        this.userPatterns.eventCategories.includes(event.metadata.category)) {
      score += 0.2
    }

    // Check if event time matches user patterns
    const eventTime = event.startDate.toTimeString().slice(0, 5)
    if (this.userPatterns.preferredTimes.includes(eventTime)) {
      score += 0.1
    }

    return Math.min(1, score)
  }

  // Analyze ambiguity level
  private analyzeAmbiguityLevel(originalInput: string): number {
    let score = 0.5 // Base score

    // Check for ambiguous words
    const ambiguousWords = [
      'maybe', 'possibly', 'might', 'could', 'perhaps', 'probably',
      'sometime', 'later', 'soon', 'eventually', 'eventually'
    ]

    const hasAmbiguousWords = ambiguousWords.some(word => 
      originalInput.toLowerCase().includes(word)
    )
    if (hasAmbiguousWords) score -= 0.3

    // Check for multiple options
    const multipleOptionsPatterns = [
      /or\s+/i,
      /either\s+/i,
      /maybe\s+/i,
      /or\s+maybe/i
    ]

    const hasMultipleOptions = multipleOptionsPatterns.some(pattern => 
      pattern.test(originalInput)
    )
    if (hasMultipleOptions) score -= 0.2

    // Check for incomplete sentences
    const incompletePatterns = [
      /^[^.!?]*$/,
      /and\s*$/,
      /or\s*$/,
      /but\s*$/
    ]

    const isIncomplete = incompletePatterns.some(pattern => 
      pattern.test(originalInput.trim())
    )
    if (isIncomplete) score -= 0.2

    return Math.max(0, score)
  }

  // Analyze completeness
  private analyzeCompleteness(event: ParsedEvent): number {
    let score = 0.5 // Base score

    // Check required fields
    if (event.title && event.title.trim().length > 0) score += 0.2
    if (event.startDate) score += 0.2
    if (event.endDate) score += 0.2

    // Check optional fields
    if (event.location) score += 0.1
    if (event.description) score += 0.1
    if (event.metadata?.category) score += 0.1
    if (event.metadata?.priority) score += 0.1

    // Check if duration is reasonable
    const duration = differenceInMinutes(event.endDate, event.startDate)
    if (duration > 0 && duration <= 480) score += 0.1 // 8 hours max

    return Math.min(1, score)
  }

  // Analyze consistency with user patterns
  private analyzeConsistency(event: ParsedEvent): number {
    let score = 0.5 // Base score

    // Check time consistency
    const eventTime = event.startDate.toTimeString().slice(0, 5)
    if (this.userPatterns.preferredTimes.includes(eventTime)) {
      score += 0.2
    }

    // Check day consistency
    const eventDay = event.startDate.toLocaleDateString('en-US', { weekday: 'long' })
    if (this.userPatterns.preferredDays.includes(eventDay)) {
      score += 0.2
    }

    // Check location consistency
    if (event.location && this.userPatterns.commonLocations.includes(event.location)) {
      score += 0.2
    }

    // Check duration consistency
    const duration = differenceInMinutes(event.endDate, event.startDate)
    const durationDiff = Math.abs(duration - this.userPatterns.averageDuration)
    const durationScore = Math.max(0, 1 - (durationDiff / this.userPatterns.averageDuration))
    score += durationScore * 0.2

    return Math.min(1, score)
  }

  // Calculate breakdown scores
  private calculateBreakdown(factors: ConfidenceFactors) {
    return {
      timeScore: factors.timeClarity,
      dateScore: factors.dateClarity,
      locationScore: factors.locationClarity,
      titleScore: factors.titleClarity,
      contextScore: factors.contextRelevance,
      ambiguityScore: factors.ambiguityLevel,
      completenessScore: factors.completeness,
      consistencyScore: factors.consistency
    }
  }

  // Calculate overall score
  private calculateOverallScore(breakdown: ReturnType<typeof this.calculateBreakdown>): number {
    const weights = {
      timeScore: 0.2,
      dateScore: 0.2,
      locationScore: 0.1,
      titleScore: 0.15,
      contextScore: 0.1,
      ambiguityScore: 0.1,
      completenessScore: 0.1,
      consistencyScore: 0.05
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const [key, weight] of Object.entries(weights)) {
      const score = breakdown[key as keyof typeof breakdown]
      weightedSum += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  // Generate suggestions
  private generateSuggestions(factors: ConfidenceFactors, breakdown: ReturnType<typeof this.calculateBreakdown>): string[] {
    const suggestions: string[] = []

    if (breakdown.timeScore < 0.7) {
      suggestions.push('Be more specific about the time (e.g., "2:30 PM" instead of "afternoon")')
    }

    if (breakdown.dateScore < 0.7) {
      suggestions.push('Specify the date more clearly (e.g., "tomorrow" or "next Monday")')
    }

    if (breakdown.locationScore < 0.7) {
      suggestions.push('Include the location if relevant (e.g., "meeting at the office")')
    }

    if (breakdown.titleScore < 0.7) {
      suggestions.push('Use a more descriptive title (e.g., "Team standup meeting" instead of "meeting")')
    }

    if (breakdown.contextScore < 0.7) {
      suggestions.push('Consider scheduling during your usual working hours')
    }

    if (breakdown.ambiguityScore < 0.7) {
      suggestions.push('Avoid ambiguous words like "maybe" or "sometime"')
    }

    if (breakdown.completenessScore < 0.7) {
      suggestions.push('Include more details like duration, location, or description')
    }

    if (breakdown.consistencyScore < 0.7) {
      suggestions.push('Consider scheduling at times that match your usual patterns')
    }

    return suggestions
  }

  // Generate warnings
  private generateWarnings(factors: ConfidenceFactors, breakdown: ReturnType<typeof this.calculateBreakdown>): string[] {
    const warnings: string[] = []

    if (breakdown.timeScore < 0.5) {
      warnings.push('Time specification is unclear - event may be scheduled incorrectly')
    }

    if (breakdown.dateScore < 0.5) {
      warnings.push('Date specification is unclear - event may be scheduled on wrong date')
    }

    if (breakdown.ambiguityScore < 0.5) {
      warnings.push('Input is highly ambiguous - consider providing more specific details')
    }

    if (breakdown.completenessScore < 0.5) {
      warnings.push('Event information is incomplete - some details may be missing')
    }

    return warnings
  }
}

// Utility functions
export function createConfidenceScorer(userPatterns: UserPatterns, contextEvents: ParsedEvent[] = []): ConfidenceScorer {
  return new ConfidenceScorer(userPatterns, contextEvents)
}

export function validateConfidenceScore(score: any): ConfidenceScore {  
  return score as ConfidenceScore
}

export function createDefaultUserPatterns(): UserPatterns {
  return {
    preferredTimes: ['09:00', '14:00', '16:00'],
    preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    commonLocations: ['Office', 'Home', 'Conference Room'],
    eventCategories: ['work', 'personal', 'meeting'],
    averageDuration: 60,
    workingHours: { start: '09:00', end: '17:00' }
  }
}
