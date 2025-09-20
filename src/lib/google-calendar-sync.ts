import { z } from 'zod'
import { GoogleCalendarClient, CalendarEvent } from './google-calendar'
import { webhookManager } from './google-calendar-webhook'

// Sync conflict types
export interface SyncConflict {
  id: string
  type: 'concurrent_edit' | 'deleted_modified' | 'permission_denied' | 'quota_exceeded'
  localEvent: CalendarEvent
  remoteEvent: CalendarEvent
  timestamp: Date
  resolution: 'local_wins' | 'remote_wins' | 'merge' | 'manual' | 'pending'
  message: string
}

// Sync operation types
export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  event: CalendarEvent
  timestamp: Date
  source: 'local' | 'google'
  status: 'pending' | 'completed' | 'failed' | 'conflict'
  retryCount: number
  lastError?: string
}

// Sync statistics
export interface SyncStats {
  totalEvents: number
  syncedEvents: number
  conflictedEvents: number
  failedEvents: number
  lastSyncTime: Date
  syncDuration: number
  conflicts: SyncConflict[]
}

// Validation schemas
const SyncConflictSchema = z.object({
  id: z.string(),
  type: z.enum(['concurrent_edit', 'deleted_modified', 'permission_denied', 'quota_exceeded']),
  localEvent: z.any(), // CalendarEvent
  remoteEvent: z.any(), // CalendarEvent
  timestamp: z.date(),
  resolution: z.enum(['local_wins', 'remote_wins', 'merge', 'manual', 'pending']),
  message: z.string()
})

const SyncOperationSchema = z.object({
  id: z.string(),
  type: z.enum(['create', 'update', 'delete']),
  event: z.any(), // CalendarEvent
  timestamp: z.date(),
  source: z.enum(['local', 'google']),
  status: z.enum(['pending', 'completed', 'failed', 'conflict']),
  retryCount: z.number(),
  lastError: z.string().optional()
})

// Sync manager class
export class GoogleCalendarSyncManager {
  private conflicts: Map<string, SyncConflict> = new Map()
  private operations: Map<string, SyncOperation> = new Map()
  private syncInProgress: boolean = false
  private lastSyncTime: Date | null = null

  // Start bidirectional sync
  async startSync(
    googleClient: GoogleCalendarClient,
    localEvents: CalendarEvent[],
    options: {
      conflictResolution?: 'local_wins' | 'remote_wins' | 'merge' | 'manual'
      maxRetries?: number
      batchSize?: number
    } = {}
  ): Promise<SyncStats> {
    const startTime = Date.now()
    
    if (this.syncInProgress) {
      throw new Error('Sync already in progress')
    }

    this.syncInProgress = true

    try {
      const {
        conflictResolution = 'merge',
        maxRetries = 3,
        batchSize = 100
      } = options

      // Get remote events from Google Calendar
      const remoteEvents = await googleClient.syncEvents(this.lastSyncTime)
      
      // Detect conflicts
      const conflicts = await this.detectConflicts(localEvents, remoteEvents)
      
      // Resolve conflicts
      const resolvedConflicts = await this.resolveConflicts(conflicts, conflictResolution)
      
      // Apply changes
      const syncResults = await this.applyChanges(
        googleClient,
        localEvents,
        remoteEvents,
        resolvedConflicts,
        batchSize
      )

      // Update sync time
      this.lastSyncTime = new Date()

      const stats: SyncStats = {
        totalEvents: localEvents.length + remoteEvents.length,
        syncedEvents: syncResults.successful,
        conflictedEvents: conflicts.length,
        failedEvents: syncResults.failed,
        lastSyncTime: this.lastSyncTime,
        syncDuration: Date.now() - startTime,
        conflicts: Array.from(this.conflicts.values())
      }

      return stats
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Detect conflicts between local and remote events
  private async detectConflicts(
    localEvents: CalendarEvent[],
    remoteEvents: CalendarEvent[]
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = []
    
    // Create maps for efficient lookup
    const localEventMap = new Map(localEvents.map(event => [event.id, event]))
    const remoteEventMap = new Map(remoteEvents.map(event => [event.id, event]))

    // Check for conflicts
    for (const [eventId, localEvent] of localEventMap) {
      const remoteEvent = remoteEventMap.get(eventId)
      
      if (remoteEvent) {
        // Check for concurrent edits
        if (this.hasConcurrentEdits(localEvent, remoteEvent)) {
          conflicts.push({
            id: `conflict-${eventId}-${Date.now()}`,
            type: 'concurrent_edit',
            localEvent,
            remoteEvent,
            timestamp: new Date(),
            resolution: 'pending',
            message: 'Event was modified in both local and remote calendars'
          })
        }
      }
    }

    // Check for deleted events that were modified
    for (const [eventId, localEvent] of localEventMap) {
      if (!remoteEventMap.has(eventId) && localEvent.id) {
        // Event exists locally but not remotely (was deleted)
        conflicts.push({
          id: `conflict-deleted-${eventId}-${Date.now()}`,
          type: 'deleted_modified',
          localEvent,
          remoteEvent: localEvent, // Use local event as placeholder
          timestamp: new Date(),
          resolution: 'pending',
          message: 'Event was deleted remotely but modified locally'
        })
      }
    }

    return conflicts
  }

  // Check if events have concurrent edits
  private hasConcurrentEdits(localEvent: CalendarEvent, remoteEvent: CalendarEvent): boolean {
    // Simple comparison - in production, you might want to use more sophisticated logic
    return (
      localEvent.title !== remoteEvent.title ||
      localEvent.description !== remoteEvent.description ||
      localEvent.startTime.getTime() !== remoteEvent.startTime.getTime() ||
      localEvent.endTime.getTime() !== remoteEvent.endTime.getTime() ||
      localEvent.location !== remoteEvent.location
    )
  }

  // Resolve conflicts based on strategy
  private async resolveConflicts(
    conflicts: SyncConflict[],
    strategy: 'local_wins' | 'remote_wins' | 'merge' | 'manual'
  ): Promise<SyncConflict[]> {
    const resolvedConflicts: SyncConflict[] = []

    for (const conflict of conflicts) {
      let resolution: SyncConflict['resolution'] = 'pending'

      switch (strategy) {
        case 'local_wins':
          resolution = 'local_wins'
          break
        case 'remote_wins':
          resolution = 'remote_wins'
          break
        case 'merge':
          resolution = await this.mergeEvents(conflict)
          break
        case 'manual':
          resolution = 'manual'
          break
      }

      conflict.resolution = resolution
      resolvedConflicts.push(conflict)
      this.conflicts.set(conflict.id, conflict)
    }

    return resolvedConflicts
  }

  // Merge conflicting events
  private async mergeEvents(conflict: SyncConflict): Promise<SyncConflict['resolution']> {
    try {
      const { localEvent, remoteEvent } = conflict
      
      // Create merged event (prefer local changes for most fields)
      const mergedEvent: CalendarEvent = {
        ...localEvent,
        // Keep remote ID and timestamps
        id: remoteEvent.id,
        // Merge descriptions
        description: this.mergeDescriptions(localEvent.description, remoteEvent.description),
        // Use more recent location
        location: remoteEvent.location || localEvent.location,
        // Keep local attendees but add remote ones
        attendees: this.mergeAttendees(localEvent.attendees, remoteEvent.attendees)
      }

      // Update conflict with merged event
      conflict.localEvent = mergedEvent
      conflict.resolution = 'merge'
      conflict.message = 'Events merged successfully'

      return 'merge'
    } catch (error) {
      console.error('Error merging events:', error)
      conflict.resolution = 'manual'
      conflict.message = 'Failed to merge events automatically'
      return 'manual'
    }
  }

  // Merge event descriptions
  private mergeDescriptions(localDesc?: string, remoteDesc?: string): string {
    if (!localDesc && !remoteDesc) return ''
    if (!localDesc) return remoteDesc || ''
    if (!remoteDesc) return localDesc
    
    // Combine descriptions, removing duplicates
    const localLines = localDesc.split('\n').filter(line => line.trim())
    const remoteLines = remoteDesc.split('\n').filter(line => line.trim())
    
    const combined = [...new Set([...localLines, ...remoteLines])]
    return combined.join('\n')
  }

  // Merge attendees lists
  private mergeAttendees(
    localAttendees?: CalendarEvent['attendees'],
    remoteAttendees?: CalendarEvent['attendees']
  ): CalendarEvent['attendees'] {
    if (!localAttendees && !remoteAttendees) return undefined
    if (!localAttendees) return remoteAttendees
    if (!remoteAttendees) return localAttendees

    // Combine attendees, preferring local response status
    const attendeeMap = new Map()
    
    // Add remote attendees first
    for (const attendee of remoteAttendees) {
      attendeeMap.set(attendee.email, attendee)
    }
    
    // Override with local attendees
    for (const attendee of localAttendees) {
      attendeeMap.set(attendee.email, attendee)
    }

    return Array.from(attendeeMap.values())
  }

  // Apply changes to Google Calendar
  private async applyChanges(
    googleClient: GoogleCalendarClient,
    localEvents: CalendarEvent[],
    remoteEvents: CalendarEvent[],
    resolvedConflicts: SyncConflict[],
    batchSize: number
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0
    let failed = 0

    try {
      // Process conflicts first
      for (const conflict of resolvedConflicts) {
        try {
          if (conflict.resolution === 'local_wins' || conflict.resolution === 'merge') {
            // Update remote event with local changes
            if (conflict.localEvent.id) {
              await googleClient.updateEvent(conflict.localEvent.id, conflict.localEvent)
            }
            successful++
          } else if (conflict.resolution === 'remote_wins') {
            // Keep remote event as is
            successful++
          } else if (conflict.resolution === 'manual') {
            // Mark for manual resolution
            failed++
          }
        } catch (error) {
          console.error('Error applying conflict resolution:', error)
          failed++
        }
      }

      // Process remaining events in batches
      const localEventMap = new Map(localEvents.map(event => [event.id, event]))
      const remoteEventMap = new Map(remoteEvents.map(event => [event.id, event]))

      // Find events to create, update, or delete
      const eventsToCreate: CalendarEvent[] = []
      const eventsToUpdate: Array<{ event: CalendarEvent; updates: Partial<CalendarEvent> }> = []
      const eventsToDelete: string[] = []

      // Check for events to create (exist locally but not remotely)
      for (const [eventId, localEvent] of localEventMap) {
        if (!remoteEventMap.has(eventId) && !this.hasConflict(eventId)) {
          eventsToCreate.push(localEvent)
        }
      }

      // Check for events to update (exist in both but have differences)
      for (const [eventId, localEvent] of localEventMap) {
        const remoteEvent = remoteEventMap.get(eventId)
        if (remoteEvent && !this.hasConflict(eventId)) {
          const updates = this.getEventUpdates(localEvent, remoteEvent)
          if (Object.keys(updates).length > 0) {
            eventsToUpdate.push({ event: localEvent, updates })
          }
        }
      }

      // Check for events to delete (exist remotely but not locally)
      for (const [eventId, remoteEvent] of remoteEventMap) {
        if (!localEventMap.has(eventId) && !this.hasConflict(eventId)) {
          eventsToDelete.push(eventId)
        }
      }

      // Process creates
      for (const event of eventsToCreate) {
        try {
          await googleClient.createEvent(event)
          successful++
        } catch (error) {
          console.error('Error creating event:', error)
          failed++
        }
      }

      // Process updates
      for (const { event, updates } of eventsToUpdate) {
        try {
          if (event.id) {
            await googleClient.updateEvent(event.id, updates)
            successful++
          }
        } catch (error) {
          console.error('Error updating event:', error)
          failed++
        }
      }

      // Process deletes
      for (const eventId of eventsToDelete) {
        try {
          await googleClient.deleteEvent(eventId)
          successful++
        } catch (error) {
          console.error('Error deleting event:', error)
          failed++
        }
      }

    } catch (error) {
      console.error('Error applying changes:', error)
      throw error
    }

    return { successful, failed }
  }

  // Check if event has a conflict
  private hasConflict(eventId: string | undefined): boolean {
    if (!eventId) return false
    
    for (const conflict of this.conflicts.values()) {
      if (conflict.localEvent.id === eventId || conflict.remoteEvent.id === eventId) {
        return true
      }
    }
    
    return false
  }

  // Get updates needed for an event
  private getEventUpdates(localEvent: CalendarEvent, remoteEvent: CalendarEvent): Partial<CalendarEvent> {
    const updates: Partial<CalendarEvent> = {}

    if (localEvent.title !== remoteEvent.title) {
      updates.title = localEvent.title
    }
    if (localEvent.description !== remoteEvent.description) {
      updates.description = localEvent.description
    }
    if (localEvent.startTime.getTime() !== remoteEvent.startTime.getTime()) {
      updates.startTime = localEvent.startTime
    }
    if (localEvent.endTime.getTime() !== remoteEvent.endTime.getTime()) {
      updates.endTime = localEvent.endTime
    }
    if (localEvent.location !== remoteEvent.location) {
      updates.location = localEvent.location
    }
    if (localEvent.recurrence !== remoteEvent.recurrence) {
      updates.recurrence = localEvent.recurrence
    }

    return updates
  }

  // Get sync statistics
  getSyncStats(): SyncStats {
    return {
      totalEvents: 0, // This would be calculated from actual events
      syncedEvents: 0,
      conflictedEvents: this.conflicts.size,
      failedEvents: 0,
      lastSyncTime: this.lastSyncTime || new Date(0),
      syncDuration: 0,
      conflicts: Array.from(this.conflicts.values())
    }
  }

  // Get conflicts
  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values())
  }

  // Get conflict by ID
  getConflict(id: string): SyncConflict | undefined {
    return this.conflicts.get(id)
  }

  // Resolve conflict manually
  async resolveConflictManually(
    conflictId: string,
    resolution: 'local_wins' | 'remote_wins' | 'merge'
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict) {
      throw new Error('Conflict not found')
    }

    conflict.resolution = resolution
    this.conflicts.set(conflictId, conflict)
  }

  // Clear resolved conflicts
  clearResolvedConflicts(): void {
    for (const [id, conflict] of this.conflicts.entries()) {
      if (conflict.resolution !== 'pending' && conflict.resolution !== 'manual') {
        this.conflicts.delete(id)
      }
    }
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.syncInProgress
  }

  // Get last sync time
  getLastSyncTime(): Date | null {
    return this.lastSyncTime
  }
}

// Global sync manager instance
export const syncManager = new GoogleCalendarSyncManager()

// Sync event handlers
export class SyncEventHandlers {
  // Handle sync events from webhooks
  static async handleSyncEvent(event: any): Promise<void> {
    try {
      console.log('Sync event received:', event)
      
      // Trigger sync if not already in progress
      if (!syncManager.isSyncInProgress()) {
        // This would typically be called with actual Google client and local events
        // await syncManager.startSync(googleClient, localEvents)
      }
    } catch (error) {
      console.error('Error handling sync event:', error)
      throw error
    }
  }

  // Handle push events from webhooks
  static async handlePushEvent(event: any): Promise<void> {
    try {
      console.log('Push event received:', event)
      
      // Handle specific event changes
      switch (event.type) {
        case 'created':
          console.log('Event created:', event.eventId)
          break
        case 'updated':
          console.log('Event updated:', event.eventId)
          break
        case 'deleted':
          console.log('Event deleted:', event.eventId)
          break
      }
    } catch (error) {
      console.error('Error handling push event:', error)
      throw error
    }
  }
}

// Register sync event handlers
webhookManager.registerEventHandler('sync', SyncEventHandlers.handleSyncEvent)
webhookManager.registerEventHandler('push', SyncEventHandlers.handlePushEvent)
