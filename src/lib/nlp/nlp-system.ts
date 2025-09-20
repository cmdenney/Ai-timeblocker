import { CalendarNLPParser, ParsedCalendarEvent, ParsingResult } from './calendar-parser'
import { TimezoneUtils } from './timezone-utils'
import { RecurrenceParser, ParsedRecurrence } from './recurrence-parser'
import { ConflictDetector, ConflictAnalysis, EventInfo } from './conflict-detector'
import { ConfidenceScorer, ConfidenceScore, UserPatterns } from './confidence-scorer'

// Main NLP system interface
export interface NLPSystemConfig {
  timezone: string
  userPatterns: UserPatterns
  conflictDetection: boolean
  confidenceScoring: boolean
  recurrenceParsing: boolean
}

export interface NLPAnalysis {
  events: ParsedCalendarEvent[]
  conflicts: ConflictAnalysis
  confidence: ConfidenceScore
  recurrence: ParsedRecurrence
  suggestions: string[]
  warnings: string[]
  metadata: {
    processingTime: number
    timezone: string
    totalEvents: number
    hasConflicts: boolean
    overallConfidence: number
  }
}

// Main NLP system class
export class AdvancedNLPSystem {
  private calendarParser: CalendarNLPParser
  private timezoneUtils: TimezoneUtils
  private recurrenceParser: RecurrenceParser
  private conflictDetector: ConflictDetector
  private confidenceScorer: ConfidenceScorer
  private config: NLPSystemConfig

  constructor(config: NLPSystemConfig) {
    this.config = config
    this.calendarParser = new CalendarNLPParser(config.timezone)
    this.timezoneUtils = new TimezoneUtils(config.timezone)
    this.recurrenceParser = new RecurrenceParser(new Date(), config.timezone)
    this.conflictDetector = new ConflictDetector()
    this.confidenceScorer = new ConfidenceScorer(config.userPatterns)
  }

  // Main analysis method
  async analyzeScheduleInput(
    input: string,
    existingEvents: EventInfo[] = [],
    options: {
      context?: string
      userPreferences?: Record<string, any>
      workingHours?: { start: string; end: string }
    } = {}
  ): Promise<NLPAnalysis> {
    const startTime = Date.now()

    try {
      // Parse calendar events
      const parsingResult = await this.calendarParser.parseScheduleInput(
        input,
        existingEvents,
        options
      )

      // Analyze recurrence patterns
      const recurrence = this.recurrenceParser.parseRecurrence(input)

      // Detect conflicts
      const eventInfos = parsingResult.events.map(event => ({
        id: event.id || '',
        title: event.title,
        startTime: event.startDate,
        endTime: event.endDate,
        location: event.location,
        attendees: (event as any).attendees || [],
        category: (event as any).category || 'other',
        priority: (event as any).priority || 'medium',
        isAllDay: event.isAllDay,
        energyLevel: 'medium' as const,
        resources: [],
        metadata: event.metadata || {}
      }))
      
      const conflicts = this.config.conflictDetection
        ? this.conflictDetector.analyzeConflicts(eventInfos)
        : {
            conflicts: [],
            totalConflicts: 0,
            criticalConflicts: 0,
            suggestions: [],
            overallSeverity: 'low' as const,
            resolutionStrategies: []
          }

      // Calculate confidence scores
      const confidence = this.config.confidenceScoring
        ? this.calculateOverallConfidence(parsingResult.events, input)
        : {
            overall: 0.8,
            factors: {
              timeClarity: 0.8,
              dateClarity: 0.8,
              locationClarity: 0.8,
              titleClarity: 0.8,
              contextRelevance: 0.8,
              ambiguityLevel: 0.8,
              completeness: 0.8,
              consistency: 0.8
            },
            breakdown: {
              timeScore: 0.8,
              dateScore: 0.8,
              locationScore: 0.8,
              titleScore: 0.8,
              contextScore: 0.8,
              ambiguityScore: 0.8,
              completenessScore: 0.8,
              consistencyScore: 0.8
            },
            suggestions: [],
            warnings: []
          }

      // Generate suggestions
      const suggestions = this.generateSuggestions(parsingResult, conflicts, confidence, recurrence)

      // Generate warnings
      const warnings = this.generateWarnings(parsingResult, conflicts, confidence)

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidenceScore(confidence, conflicts)

      return {
        events: parsingResult.events,
        conflicts,
        confidence,
        recurrence,
        suggestions,
        warnings,
        metadata: {
          processingTime: Date.now() - startTime,
          timezone: this.config.timezone,
          totalEvents: parsingResult.events.length,
          hasConflicts: conflicts.totalConflicts > 0,
          overallConfidence
        }
      }
    } catch (error) {
      console.error('NLP analysis error:', error)
      throw new Error(`Failed to analyze schedule input: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Calculate overall confidence for all events
  private calculateOverallConfidence(events: ParsedCalendarEvent[], input: string): ConfidenceScore {
    if (events.length === 0) {
      return {
        overall: 0,
        factors: {
          timeClarity: 0,
          dateClarity: 0,
          locationClarity: 0,
          titleClarity: 0,
          contextRelevance: 0,
          ambiguityLevel: 0,
          completeness: 0,
          consistency: 0
        },
        breakdown: {
          timeScore: 0,
          dateScore: 0,
          locationScore: 0,
          titleScore: 0,
          contextScore: 0,
          ambiguityScore: 0,
          completenessScore: 0,
          consistencyScore: 0
        },
        suggestions: ['No events were parsed from the input'],
        warnings: ['Input could not be parsed into calendar events']
      }
    }

    // Calculate confidence for each event
    const eventConfidences = events.map(event => 
      this.confidenceScorer.calculateConfidence(event, input)
    )

    // Average the confidence scores
    const avgConfidence = eventConfidences.reduce((sum, conf) => sum + conf.overall, 0) / eventConfidences.length

    // Average the factors
    const avgFactors = {
      timeClarity: eventConfidences.reduce((sum, conf) => sum + conf.factors.timeClarity, 0) / eventConfidences.length,
      dateClarity: eventConfidences.reduce((sum, conf) => sum + conf.factors.dateClarity, 0) / eventConfidences.length,
      locationClarity: eventConfidences.reduce((sum, conf) => sum + conf.factors.locationClarity, 0) / eventConfidences.length,
      titleClarity: eventConfidences.reduce((sum, conf) => sum + conf.factors.titleClarity, 0) / eventConfidences.length,
      contextRelevance: eventConfidences.reduce((sum, conf) => sum + conf.factors.contextRelevance, 0) / eventConfidences.length,
      ambiguityLevel: eventConfidences.reduce((sum, conf) => sum + conf.factors.ambiguityLevel, 0) / eventConfidences.length,
      completeness: eventConfidences.reduce((sum, conf) => sum + conf.factors.completeness, 0) / eventConfidences.length,
      consistency: eventConfidences.reduce((sum, conf) => sum + conf.factors.consistency, 0) / eventConfidences.length
    }

    // Average the breakdown
    const avgBreakdown = {
      timeScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.timeScore, 0) / eventConfidences.length,
      dateScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.dateScore, 0) / eventConfidences.length,
      locationScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.locationScore, 0) / eventConfidences.length,
      titleScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.titleScore, 0) / eventConfidences.length,
      contextScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.contextScore, 0) / eventConfidences.length,
      ambiguityScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.ambiguityScore, 0) / eventConfidences.length,
      completenessScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.completenessScore, 0) / eventConfidences.length,
      consistencyScore: eventConfidences.reduce((sum, conf) => sum + conf.breakdown.consistencyScore, 0) / eventConfidences.length
    }

    // Combine suggestions and warnings
    const allSuggestions = eventConfidences.flatMap(conf => conf.suggestions)
    const allWarnings = eventConfidences.flatMap(conf => conf.warnings)

    return {
      overall: avgConfidence,
      factors: avgFactors,
      breakdown: avgBreakdown,
      suggestions: [...new Set(allSuggestions)],
      warnings: [...new Set(allWarnings)]
    }
  }

  // Calculate overall confidence score considering conflicts
  private calculateOverallConfidenceScore(confidence: ConfidenceScore, conflicts: ConflictAnalysis): number {
    let score = confidence.overall

    // Reduce confidence based on conflicts
    if (conflicts.criticalConflicts > 0) {
      score *= 0.7
    } else if (conflicts.totalConflicts > 3) {
      score *= 0.8
    } else if (conflicts.totalConflicts > 0) {
      score *= 0.9
    }

    return Math.max(0, Math.min(1, score))
  }

  // Generate suggestions based on analysis
  private generateSuggestions(
    parsingResult: ParsingResult,
    conflicts: ConflictAnalysis,
    confidence: ConfidenceScore,
    recurrence: ParsedRecurrence
  ): string[] {
    const suggestions: string[] = []

    // Add parsing suggestions
    suggestions.push(...parsingResult.suggestions)

    // Add conflict suggestions
    suggestions.push(...conflicts.suggestions)

    // Add confidence suggestions
    suggestions.push(...confidence.suggestions)

    // Add recurrence suggestions
    if (recurrence.hasRecurrence && recurrence.pattern) {
      suggestions.push(`Recurring event detected: ${recurrence.pattern.description}`)
    }

    // Add general suggestions
    if (parsingResult.events.length > 5) {
      suggestions.push('Consider breaking down large schedules into smaller chunks')
    }

    if (conflicts.overallSeverity === 'critical') {
      suggestions.push('Critical conflicts detected. Please review and resolve before scheduling.')
    }

    return [...new Set(suggestions)] // Remove duplicates
  }

  // Generate warnings based on analysis
  private generateWarnings(
    parsingResult: ParsingResult,
    conflicts: ConflictAnalysis,
    confidence: ConfidenceScore
  ): string[] {
    const warnings: string[] = []

    // Add parsing warnings
    warnings.push(...parsingResult.warnings)

    // Add conflict warnings
    if (conflicts.criticalConflicts > 0) {
      warnings.push(`${conflicts.criticalConflicts} critical conflicts detected`)
    }

    if (conflicts.overallSeverity === 'high') {
      warnings.push('High severity conflicts detected')
    }

    // Add confidence warnings
    warnings.push(...confidence.warnings)

    // Add general warnings
    if (confidence.overall < 0.5) {
      warnings.push('Low confidence in parsed events. Please review and clarify.')
    }

    if (parsingResult.needsClarification) {
      warnings.push('Input requires clarification for accurate parsing')
    }

    return [...new Set(warnings)] // Remove duplicates
  }

  // Update user patterns
  updateUserPatterns(newPatterns: Partial<UserPatterns>): void {
    this.config.userPatterns = { ...this.config.userPatterns, ...newPatterns }
    this.confidenceScorer = new ConfidenceScorer(this.config.userPatterns)
  }

  // Update timezone
  updateTimezone(newTimezone: string): void {
    this.config.timezone = newTimezone
    this.calendarParser = new CalendarNLPParser(newTimezone)
    this.timezoneUtils = new TimezoneUtils(newTimezone)
    this.recurrenceParser = new RecurrenceParser(new Date(), newTimezone)
  }

  // Get system configuration
  getConfig(): NLPSystemConfig {
    return { ...this.config }
  }

  // Validate input
  validateInput(input: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!input || input.trim().length === 0) {
      errors.push('Input cannot be empty')
    }

    if (input.trim().length < 3) {
      errors.push('Input too short to parse meaningful events')
    }

    if (input.length > 1000) {
      errors.push('Input too long. Please break down into smaller chunks')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Get system statistics
  getSystemStats(): {
    timezone: string
    userPatterns: UserPatterns
    conflictDetectionEnabled: boolean
    confidenceScoringEnabled: boolean
    recurrenceParsingEnabled: boolean
  } {
    return {
      timezone: this.config.timezone,
      userPatterns: this.config.userPatterns,
      conflictDetectionEnabled: this.config.conflictDetection,
      confidenceScoringEnabled: this.config.confidenceScoring,
      recurrenceParsingEnabled: this.config.recurrenceParsing
    }
  }
}

// Factory function
export function createAdvancedNLPSystem(config: NLPSystemConfig): AdvancedNLPSystem {
  return new AdvancedNLPSystem(config)
}

// Default configuration
export function createDefaultNLPSystemConfig(timezone: string = 'UTC'): NLPSystemConfig {
  return {
    timezone,
    userPatterns: {
      preferredTimes: ['09:00', '14:00', '16:00'],
      preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      commonLocations: ['Office', 'Home', 'Conference Room'],
      eventCategories: ['work', 'personal', 'meeting'],
      averageDuration: 60,
      workingHours: { start: '09:00', end: '17:00' }
    },
    conflictDetection: true,
    confidenceScoring: true,
    recurrenceParsing: true
  }
}

// Utility functions
export function validateNLPAnalysis(analysis: any): NLPAnalysis {
  // This would use Zod schemas to validate the analysis
  return analysis
}

export function formatNLPAnalysis(analysis: NLPAnalysis): string {
  let output = `NLP Analysis Results:\n`
  output += `- Total Events: ${analysis.metadata.totalEvents}\n`
  output += `- Overall Confidence: ${(analysis.metadata.overallConfidence * 100).toFixed(1)}%\n`
  output += `- Processing Time: ${analysis.metadata.processingTime}ms\n`
  output += `- Has Conflicts: ${analysis.metadata.hasConflicts ? 'Yes' : 'No'}\n`
  
  if (analysis.conflicts.totalConflicts > 0) {
    output += `- Conflicts: ${analysis.conflicts.totalConflicts} (${analysis.conflicts.criticalConflicts} critical)\n`
  }
  
  if (analysis.recurrence.hasRecurrence) {
    output += `- Recurrence: ${analysis.recurrence.pattern?.description || 'Detected'}\n`
  }
  
  if (analysis.suggestions.length > 0) {
    output += `\nSuggestions:\n`
    analysis.suggestions.forEach(suggestion => {
      output += `- ${suggestion}\n`
    })
  }
  
  if (analysis.warnings.length > 0) {
    output += `\nWarnings:\n`
    analysis.warnings.forEach(warning => {
      output += `- ${warning}\n`
    })
  }
  
  return output
}
