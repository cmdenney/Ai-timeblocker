import { differenceInMinutes, isAfter, isBefore, isSameDay, addMinutes, subMinutes } from 'date-fns'
import { z } from 'zod'

// Conflict types
export interface ConflictInfo {
  id: string
  type: 'overlap' | 'same_time' | 'travel_time' | 'insufficient_break' | 'energy_mismatch' | 'resource_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  conflictingEvent: string
  conflictingEventId: string
  suggestion: string
  timeOverlap?: number // minutes
  distance?: number // meters
  energyLevel?: 'low' | 'medium' | 'high'
  resolution?: ConflictResolution
}

export interface ConflictResolution {
  type: 'reschedule' | 'shorten' | 'extend' | 'move_location' | 'split' | 'cancel' | 'merge'
  description: string
  newStartTime?: Date
  newEndTime?: Date
  newLocation?: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
}

export interface EventInfo {
  id: string
  title: string
  startTime: Date
  endTime: Date
  location?: string
  isAllDay?: boolean
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  energyLevel?: 'low' | 'medium' | 'high'
  attendees?: string[]
  resources?: string[]
  estimatedTravelTime?: number // minutes
}

export interface ConflictAnalysis {
  conflicts: ConflictInfo[]
  totalConflicts: number
  criticalConflicts: number
  suggestions: string[]
  overallSeverity: 'low' | 'medium' | 'high' | 'critical'
  resolutionStrategies: ConflictResolution[]
}

// Validation schemas
const ConflictInfoSchema = z.object({
  id: z.string(),
  type: z.enum(['overlap', 'same_time', 'travel_time', 'insufficient_break', 'energy_mismatch', 'resource_conflict']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  conflictingEvent: z.string(),
  conflictingEventId: z.string(),
  suggestion: z.string(),
  timeOverlap: z.number().optional(),
  distance: z.number().optional(),
  energyLevel: z.enum(['low', 'medium', 'high']).optional(),
  resolution: z.any().optional()
})

const ConflictResolutionSchema = z.object({
  type: z.enum(['reschedule', 'shorten', 'extend', 'move_location', 'split', 'cancel', 'merge']),
  description: z.string(),
  newStartTime: z.date().optional(),
  newEndTime: z.date().optional(),
  newLocation: z.string().optional(),
  confidence: z.number().min(0).max(1),
  impact: z.enum(['low', 'medium', 'high'])
})

const EventInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().optional(),
  isAllDay: z.boolean().optional(),
  category: z.enum(['work', 'personal', 'meeting', 'break', 'focus', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  energyLevel: z.enum(['low', 'medium', 'high']).optional(),
  attendees: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  estimatedTravelTime: z.number().optional()
})

const ConflictAnalysisSchema = z.object({
  conflicts: z.array(ConflictInfoSchema),
  totalConflicts: z.number(),
  criticalConflicts: z.number(),
  suggestions: z.array(z.string()),
  overallSeverity: z.enum(['low', 'medium', 'high', 'critical']),
  resolutionStrategies: z.array(ConflictResolutionSchema)
})

// Conflict detector class
export class ConflictDetector {
  private travelTimeBuffer: number = 15 // minutes
  private breakTimeBuffer: number = 10 // minutes
  private energyThreshold: number = 0.7 // threshold for energy mismatch

  constructor(options: {
    travelTimeBuffer?: number
    breakTimeBuffer?: number
    energyThreshold?: number
  } = {}) {
    this.travelTimeBuffer = options.travelTimeBuffer || 15
    this.breakTimeBuffer = options.breakTimeBuffer || 10
    this.energyThreshold = options.energyThreshold || 0.7
  }

  // Analyze conflicts between events
  analyzeConflicts(events: EventInfo[]): ConflictAnalysis {
    const conflicts: ConflictInfo[] = []
    const resolutionStrategies: ConflictResolution[] = []

    // Check all pairs of events for conflicts
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]

        // Check for time conflicts
        const timeConflicts = this.detectTimeConflicts(event1, event2)
        conflicts.push(...timeConflicts)

        // Check for travel time conflicts
        const travelConflicts = this.detectTravelTimeConflicts(event1, event2)
        conflicts.push(...travelConflicts)

        // Check for energy mismatches
        const energyConflicts = this.detectEnergyConflicts(event1, event2)
        conflicts.push(...energyConflicts)

        // Check for resource conflicts
        const resourceConflicts = this.detectResourceConflicts(event1, event2)
        conflicts.push(...resourceConflicts)
      }
    }

    // Generate resolution strategies
    for (const conflict of conflicts) {
      const resolution = this.generateResolutionStrategy(conflict, events)
      if (resolution) {
        resolutionStrategies.push(resolution)
      }
    }

    // Calculate overall severity
    const overallSeverity = this.calculateOverallSeverity(conflicts)
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length

    // Generate suggestions
    const suggestions = this.generateSuggestions(conflicts, resolutionStrategies)

    return {
      conflicts,
      totalConflicts: conflicts.length,
      criticalConflicts,
      suggestions,
      overallSeverity,
      resolutionStrategies
    }
  }

  // Detect time conflicts between two events
  private detectTimeConflicts(event1: EventInfo, event2: EventInfo): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []

    // Check for overlap
    if (this.hasTimeOverlap(event1, event2)) {
      const overlapMinutes = this.calculateOverlap(event1, event2)
      
      let severity: ConflictInfo['severity'] = 'low'
      let suggestion = ''

      if (overlapMinutes > 60) {
        severity = 'critical'
        suggestion = 'Major time overlap detected. One event must be rescheduled.'
      } else if (overlapMinutes > 30) {
        severity = 'high'
        suggestion = 'Significant time overlap. Consider rescheduling one event.'
      } else if (overlapMinutes > 15) {
        severity = 'medium'
        suggestion = 'Minor time overlap. Consider adjusting times.'
      } else {
        severity = 'low'
        suggestion = 'Small time overlap. Consider adding buffer time.'
      }

      // Check for same time
      if (event1.startTime.getTime() === event2.startTime.getTime()) {
        severity = 'critical'
        suggestion = 'Events are scheduled at exactly the same time.'
      }

      conflicts.push({
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'overlap',
        severity,
        conflictingEvent: event2.title,
        conflictingEventId: event2.id,
        suggestion,
        timeOverlap: overlapMinutes
      })
    }

    // Check for insufficient break time
    const breakTime = this.calculateBreakTime(event1, event2)
    if (breakTime > 0 && breakTime < this.breakTimeBuffer) {
      conflicts.push({
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'insufficient_break',
        severity: 'medium',
        conflictingEvent: event2.title,
        conflictingEventId: event2.id,
        suggestion: `Only ${breakTime} minutes between events. Consider adding more break time.`,
        timeOverlap: breakTime
      })
    }

    return conflicts
  }

  // Detect travel time conflicts
  private detectTravelTimeConflicts(event1: EventInfo, event2: EventInfo): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []

    // Only check if both events have locations
    if (!event1.location || !event2.location || event1.location === event2.location) {
      return conflicts
    }

    // Check if events are consecutive
    const timeBetween = this.calculateBreakTime(event1, event2)
    if (timeBetween > 0 && timeBetween < this.travelTimeBuffer) {
      const estimatedTravelTime = this.estimateTravelTime(event1.location, event2.location)
      
      if (timeBetween < estimatedTravelTime) {
        conflicts.push({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'travel_time',
          severity: 'high',
          conflictingEvent: event2.title,
          conflictingEventId: event2.id,
          suggestion: `Insufficient travel time between locations. Estimated travel time: ${estimatedTravelTime} minutes.`,
          timeOverlap: timeBetween,
          distance: this.calculateDistance(event1.location, event2.location)
        })
      }
    }

    return conflicts
  }

  // Detect energy mismatches
  private detectEnergyConflicts(event1: EventInfo, event2: EventInfo): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []

    // Only check if both events have energy levels
    if (!event1.energyLevel || !event2.energyLevel) {
      return conflicts
    }

    const energyLevels = { low: 1, medium: 2, high: 3 }
    const energy1 = energyLevels[event1.energyLevel]
    const energy2 = energyLevels[event2.energyLevel]
    const energyDiff = Math.abs(energy1 - energy2)

    // Check if events are consecutive
    const timeBetween = this.calculateBreakTime(event1, event2)
    if (timeBetween > 0 && timeBetween < 30) { // Within 30 minutes
      if (energyDiff >= 2) { // High energy difference
        conflicts.push({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'energy_mismatch',
          severity: 'medium',
          conflictingEvent: event2.title,
          conflictingEventId: event2.id,
          suggestion: `Energy mismatch detected. Consider scheduling similar energy level events together.`,
          energyLevel: event2.energyLevel
        })
      }
    }

    return conflicts
  }

  // Detect resource conflicts
  private detectResourceConflicts(event1: EventInfo, event2: EventInfo): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []

    // Check if events share resources
    if (event1.resources && event2.resources) {
      const sharedResources = event1.resources.filter(resource => 
        event2.resources!.includes(resource)
      )

      if (sharedResources.length > 0) {
        // Check if events overlap in time
        if (this.hasTimeOverlap(event1, event2)) {
          conflicts.push({
            id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'resource_conflict',
            severity: 'high',
            conflictingEvent: event2.title,
            conflictingEventId: event2.id,
            suggestion: `Resource conflict detected. Both events require: ${sharedResources.join(', ')}`,
            timeOverlap: this.calculateOverlap(event1, event2)
          })
        }
      }
    }

    return conflicts
  }

  // Check if two events have time overlap
  private hasTimeOverlap(event1: EventInfo, event2: EventInfo): boolean {
    return event1.startTime < event2.endTime && event2.startTime < event1.endTime
  }

  // Calculate overlap in minutes
  private calculateOverlap(event1: EventInfo, event2: EventInfo): number {
    if (!this.hasTimeOverlap(event1, event2)) return 0

    const overlapStart = new Date(Math.max(event1.startTime.getTime(), event2.startTime.getTime()))
    const overlapEnd = new Date(Math.min(event1.endTime.getTime(), event2.endTime.getTime()))
    
    return differenceInMinutes(overlapEnd, overlapStart)
  }

  // Calculate break time between events
  private calculateBreakTime(event1: EventInfo, event2: EventInfo): number {
    // Check if event1 ends before event2 starts
    if (event1.endTime <= event2.startTime) {
      return differenceInMinutes(event2.startTime, event1.endTime)
    }
    
    // Check if event2 ends before event1 starts
    if (event2.endTime <= event1.startTime) {
      return differenceInMinutes(event1.startTime, event2.endTime)
    }
    
    return 0 // Events overlap
  }

  // Estimate travel time between locations
  private estimateTravelTime(location1: string, location2: string): number {
    // This would typically integrate with a mapping service
    // For now, return a simple estimate based on location names
    if (location1 === location2) return 0
    
    // Simple heuristic: if locations are similar, assume short travel
    if (location1.toLowerCase().includes(location2.toLowerCase()) || 
        location2.toLowerCase().includes(location1.toLowerCase())) {
      return 5
    }
    
    // Default estimate
    return 30
  }

  // Calculate distance between locations
  private calculateDistance(location1: string, location2: string): number {
    // This would typically integrate with a mapping service
    // For now, return a simple estimate
    if (location1 === location2) return 0
    
    // Simple heuristic based on location names
    if (location1.toLowerCase().includes('home') && location2.toLowerCase().includes('office')) {
      return 10000 // 10km
    }
    
    return 5000 // 5km default
  }

  // Generate resolution strategy for a conflict
  private generateResolutionStrategy(conflict: ConflictInfo, events: EventInfo[]): ConflictResolution | null {
    const conflictingEvent = events.find(e => e.id === conflict.conflictingEventId)
    if (!conflictingEvent) return null

    switch (conflict.type) {
      case 'overlap':
        return this.generateOverlapResolution(conflict, conflictingEvent)
      
      case 'travel_time':
        return this.generateTravelTimeResolution(conflict, conflictingEvent)
      
      case 'insufficient_break':
        return this.generateBreakTimeResolution(conflict, conflictingEvent)
      
      case 'energy_mismatch':
        return this.generateEnergyResolution(conflict, conflictingEvent)
      
      case 'resource_conflict':
        return this.generateResourceResolution(conflict, conflictingEvent)
      
      default:
        return null
    }
  }

  // Generate resolution for overlap conflicts
  private generateOverlapResolution(conflict: ConflictInfo, event: EventInfo): ConflictResolution {
    const overlapMinutes = conflict.timeOverlap || 0
    
    if (overlapMinutes > 60) {
      return {
        type: 'reschedule',
        description: 'Reschedule one of the overlapping events to a different time',
        confidence: 0.9,
        impact: 'high'
      }
    } else if (overlapMinutes > 30) {
      return {
        type: 'shorten',
        description: 'Shorten one of the events to reduce overlap',
        confidence: 0.7,
        impact: 'medium'
      }
    } else {
      return {
        type: 'extend',
        description: 'Add buffer time to prevent future overlaps',
        confidence: 0.6,
        impact: 'low'
      }
    }
  }

  // Generate resolution for travel time conflicts
  private generateTravelTimeResolution(conflict: ConflictInfo, event: EventInfo): ConflictResolution {
    return {
      type: 'reschedule',
      description: 'Reschedule one event to allow sufficient travel time',
      newStartTime: addMinutes(event.startTime, this.travelTimeBuffer),
      confidence: 0.8,
      impact: 'medium'
    }
  }

  // Generate resolution for break time conflicts
  private generateBreakTimeResolution(conflict: ConflictInfo, event: EventInfo): ConflictResolution {
    return {
      type: 'extend',
      description: 'Add more break time between events',
      newStartTime: addMinutes(event.startTime, this.breakTimeBuffer),
      confidence: 0.7,
      impact: 'low'
    }
  }

  // Generate resolution for energy conflicts
  private generateEnergyResolution(conflict: ConflictInfo, event: EventInfo): ConflictResolution {
    return {
      type: 'reschedule',
      description: 'Reschedule to group similar energy level events together',
      confidence: 0.6,
      impact: 'low'
    }
  }

  // Generate resolution for resource conflicts
  private generateResourceResolution(conflict: ConflictInfo, event: EventInfo): ConflictResolution {
    return {
      type: 'reschedule',
      description: 'Reschedule one event to avoid resource conflicts',
      confidence: 0.9,
      impact: 'high'
    }
  }

  // Calculate overall severity
  private calculateOverallSeverity(conflicts: ConflictInfo[]): ConflictAnalysis['overallSeverity'] {
    if (conflicts.length === 0) return 'low'
    
    const criticalCount = conflicts.filter(c => c.severity === 'critical').length
    const highCount = conflicts.filter(c => c.severity === 'high').length
    const mediumCount = conflicts.filter(c => c.severity === 'medium').length
    
    if (criticalCount > 0) return 'critical'
    if (highCount > 2) return 'high'
    if (highCount > 0 || mediumCount > 3) return 'medium'
    return 'low'
  }

  // Generate suggestions based on conflicts
  private generateSuggestions(conflicts: ConflictInfo[], resolutions: ConflictResolution[]): string[] {
    const suggestions: string[] = []
    
    // Group conflicts by type
    const conflictTypes = conflicts.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Generate type-specific suggestions
    if (conflictTypes.overlap > 0) {
      suggestions.push('Consider using a calendar app with conflict detection')
    }
    
    if (conflictTypes.travel_time > 0) {
      suggestions.push('Add travel time buffers between events at different locations')
    }
    
    if (conflictTypes.insufficient_break > 0) {
      suggestions.push('Schedule regular breaks between intensive activities')
    }
    
    if (conflictTypes.energy_mismatch > 0) {
      suggestions.push('Group similar energy level activities together')
    }
    
    if (conflictTypes.resource_conflict > 0) {
      suggestions.push('Use a resource booking system to avoid conflicts')
    }

    // Add general suggestions
    if (conflicts.length > 5) {
      suggestions.push('Consider reducing the number of events or spreading them out')
    }
    
    if (resolutions.length > 0) {
      suggestions.push('Review the suggested resolutions and implement the most suitable ones')
    }

    return [...new Set(suggestions)] // Remove duplicates
  }
}

// Utility functions
export function createConflictDetector(options?: {
  travelTimeBuffer?: number
  breakTimeBuffer?: number
  energyThreshold?: number
}): ConflictDetector {
  return new ConflictDetector(options)
}

export function validateEventInfo(event: any): EventInfo {
  return event as EventInfo
}

export function validateConflictInfo(conflict: any): ConflictInfo {     
  return conflict as ConflictInfo
}

export function validateConflictAnalysis(analysis: any): ConflictAnalysis {
  return analysis as ConflictAnalysis
}
