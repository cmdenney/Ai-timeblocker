import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'

// Calendar event types
export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  timeZone: string
  location?: string
  recurrence?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction'
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  visibility?: 'default' | 'public' | 'private'
  status?: 'confirmed' | 'tentative' | 'cancelled'
  htmlLink?: string
  hangoutLink?: string
  conferenceData?: {
    createRequest?: {
      requestId: string
      conferenceSolutionKey: {
        type: 'hangoutsMeet' | 'eventHangout'
      }
    }
  }
}

// Sync operation types
export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  event: CalendarEvent
  timestamp: Date
  source: 'local' | 'google'
  status: 'pending' | 'completed' | 'failed'
  error?: string
}

// Webhook notification types
export interface WebhookNotification {
  id: string
  resourceId: string
  resourceUri: string
  token: string
  expiration: string
  type: 'sync' | 'push'
}

// Validation schemas
const CalendarEventSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  timeZone: z.string(),
  location: z.string().optional(),
  recurrence: z.string().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    responseStatus: z.enum(['accepted', 'declined', 'tentative', 'needsAction']).optional()
  })).optional(),
  reminders: z.object({
    useDefault: z.boolean(),
    overrides: z.array(z.object({
      method: z.enum(['email', 'popup']),
      minutes: z.number()
    })).optional()
  }).optional(),
  visibility: z.enum(['default', 'public', 'private']).optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
  htmlLink: z.string().optional(),
  hangoutLink: z.string().optional()
})

// Google Calendar Client
export class GoogleCalendarClient {
  private oauth2Client: OAuth2Client
  public calendar: calendar_v3.Calendar

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  // Create a new calendar event
  async createEvent(event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    try {
      // Validate event data
      const validatedEvent = CalendarEventSchema.parse(event)

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: validatedEvent.title,
          description: validatedEvent.description,
          start: {
            dateTime: validatedEvent.startTime.toISOString(),
            timeZone: validatedEvent.timeZone
          },
          end: {
            dateTime: validatedEvent.endTime.toISOString(),
            timeZone: validatedEvent.timeZone
          },
          location: validatedEvent.location,
          recurrence: validatedEvent.recurrence ? [validatedEvent.recurrence] : undefined,
          attendees: validatedEvent.attendees?.map(attendee => ({
            email: attendee.email,
            displayName: attendee.displayName,
            responseStatus: attendee.responseStatus
          })),
          reminders: validatedEvent.reminders,
          visibility: validatedEvent.visibility,
          status: validatedEvent.status,
          conferenceData: (validatedEvent as any).conferenceData
        }
      })

      return response.data
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Sync events from Google Calendar
  async syncEvents(lastSyncTime?: Date): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: lastSyncTime?.toISOString() || new Date().toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500 // Maximum allowed by API
      })

      const events = response.data.items || []
      
      return events.map(event => this.convertGoogleEventToCalendarEvent(event))
    } catch (error) {
      console.error('Error syncing calendar events:', error)
      throw new Error(`Failed to sync calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update an existing calendar event
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<calendar_v3.Schema$Event> {
    try {
      const updateData: any = {}

      if (updates.title) updateData.summary = updates.title
      if (updates.description) updateData.description = updates.description
      if (updates.startTime) updateData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: updates.timeZone || 'UTC'
      }
      if (updates.endTime) updateData.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: updates.timeZone || 'UTC'
      }
      if (updates.location) updateData.location = updates.location
      if (updates.recurrence) updateData.recurrence = [updates.recurrence]
      if (updates.attendees) updateData.attendees = updates.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus
      }))
      if (updates.reminders) updateData.reminders = updates.reminders
      if (updates.visibility) updateData.visibility = updates.visibility
      if (updates.status) updateData.status = updates.status

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: updateData
      })

      return response.data
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw new Error(`Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId
      })
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw new Error(`Failed to delete calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get a specific event by ID
  async getEvent(eventId: string): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId
      })

      return this.convertGoogleEventToCalendarEvent(response.data)
    } catch (error) {
      console.error('Error getting calendar event:', error)
      throw new Error(`Failed to get calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // List calendars
  async listCalendars(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      const response = await this.calendar.calendarList.list()
      return response.data.items || []
    } catch (error) {
      console.error('Error listing calendars:', error)
      throw new Error(`Failed to list calendars: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Set up webhook notifications
  async setupWebhook(webhookUrl: string): Promise<WebhookNotification> {
    try {
      const response = await this.calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: `ai-timeblocker-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          token: process.env.GOOGLE_WEBHOOK_SECRET
        }
      })

      return {
        id: response.data.id || '',
        resourceId: response.data.resourceId || '',
        resourceUri: response.data.resourceUri || '',
        token: response.data.token || '',
        expiration: response.data.expiration || '',
        type: 'push'
      }
    } catch (error) {
      console.error('Error setting up webhook:', error)
      throw new Error(`Failed to setup webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Stop webhook notifications
  async stopWebhook(resourceId: string): Promise<void> {
    try {
      await this.calendar.channels.stop({
        requestBody: {
          id: resourceId
        }
      })
    } catch (error) {
      console.error('Error stopping webhook:', error)
      throw new Error(`Failed to stop webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Convert Google Calendar event to our CalendarEvent format
  private convertGoogleEventToCalendarEvent(googleEvent: calendar_v3.Schema$Event): CalendarEvent {
    return {
      id: googleEvent.id || undefined,
      title: googleEvent.summary || '',
      description: googleEvent.description || undefined,
      startTime: googleEvent.start?.dateTime ? new Date(googleEvent.start.dateTime) : new Date(),
      endTime: googleEvent.end?.dateTime ? new Date(googleEvent.end.dateTime) : new Date(),
      timeZone: googleEvent.start?.timeZone || 'UTC',
      location: googleEvent.location || undefined,
      recurrence: googleEvent.recurrence?.[0] || undefined,
      attendees: googleEvent.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needsAction' | undefined
      })),
      reminders: googleEvent.reminders ? {
        useDefault: googleEvent.reminders.useDefault || false,
        overrides: googleEvent.reminders.overrides?.map(override => ({
          method: override.method as 'email' | 'popup',
          minutes: override.minutes || 0
        }))
      } : undefined,
      visibility: googleEvent.visibility as 'default' | 'public' | 'private' | undefined,
      status: googleEvent.status as 'confirmed' | 'tentative' | 'cancelled' | undefined,
      htmlLink: googleEvent.htmlLink || undefined,
      hangoutLink: googleEvent.hangoutLink || undefined
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string }> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      
      this.oauth2Client.setCredentials(credentials)
      
      return {
        accessToken: credentials.access_token || '',
        refreshToken: credentials.refresh_token
      }
    } catch (error) {
      console.error('Error refreshing access token:', error)
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if token is valid
  async isTokenValid(): Promise<boolean> {
    try {
      await this.calendar.calendarList.list({ maxResults: 1 })
      return true
    } catch (error) {
      return false
    }
  }
}

// Utility functions
export function createGoogleCalendarClient(accessToken: string, refreshToken?: string): GoogleCalendarClient {
  return new GoogleCalendarClient(accessToken, refreshToken)
}

// Batch operations for performance
export class GoogleCalendarBatchClient {
  private client: GoogleCalendarClient
  private operations: Array<{
    id: string
    type: 'create' | 'update' | 'delete'
    event?: CalendarEvent
    eventId?: string
    updates?: Partial<CalendarEvent>
  }> = []

  constructor(client: GoogleCalendarClient) {
    this.client = client
  }

  // Add create operation to batch
  addCreateOperation(id: string, event: CalendarEvent): void {
    this.operations.push({ id, type: 'create', event })
  }

  // Add update operation to batch
  addUpdateOperation(id: string, eventId: string, updates: Partial<CalendarEvent>): void {
    this.operations.push({ id, type: 'update', eventId, updates })
  }

  // Add delete operation to batch
  addDeleteOperation(id: string, eventId: string): void {
    this.operations.push({ id, type: 'delete', eventId })
  }

  // Execute all batch operations
  async executeBatch(): Promise<Array<{
    id: string
    success: boolean
    result?: any
    error?: string
  }>> {
    const results = []

    for (const operation of this.operations) {
      try {
        let result
        switch (operation.type) {
          case 'create':
            result = await this.client.createEvent(operation.event!)
            break
          case 'update':
            result = await this.client.updateEvent(operation.eventId!, operation.updates!)
            break
          case 'delete':
            await this.client.deleteEvent(operation.eventId!)
            result = { deleted: true }
            break
        }

        results.push({
          id: operation.id,
          success: true,
          result
        })
      } catch (error) {
        results.push({
          id: operation.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Clear operations after execution
    this.operations = []
    
    return results
  }

  // Get pending operations count
  getPendingOperationsCount(): number {
    return this.operations.length
  }

  // Clear all pending operations
  clearOperations(): void {
    this.operations = []
  }
}
