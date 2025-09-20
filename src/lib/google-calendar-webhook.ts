import { NextRequest } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { z } from 'zod'

// Webhook notification types
export interface WebhookNotification {
  id: string
  resourceId: string
  resourceUri: string
  token: string
  expiration: string
  type: 'sync' | 'push'
  headers: Record<string, string>
  body: any
  timestamp: Date
}

// Webhook event types
export interface WebhookEvent {
  id: string
  type: 'created' | 'updated' | 'deleted'
  eventId: string
  calendarId: string
  timestamp: Date
  data: any
}

// Webhook validation schema
const WebhookNotificationSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  resourceUri: z.string(),
  token: z.string(),
  expiration: z.string(),
  type: z.enum(['sync', 'push']),
  headers: z.record(z.string()),
  body: z.any(),
  timestamp: z.date()
})

// Webhook manager class
export class GoogleCalendarWebhookManager {
  private webhooks: Map<string, WebhookNotification> = new Map()
  private eventHandlers: Map<string, (event: WebhookEvent) => Promise<void>> = new Map()

  // Register webhook
  registerWebhook(notification: WebhookNotification): void {
    this.webhooks.set(notification.id, notification)
  }

  // Unregister webhook
  unregisterWebhook(id: string): void {
    this.webhooks.delete(id)
  }

  // Register event handler
  registerEventHandler(
    eventType: string,
    handler: (event: WebhookEvent) => Promise<void>
  ): void {
    this.eventHandlers.set(eventType, handler)
  }

  // Process webhook notification
  async processWebhookNotification(
    request: NextRequest,
    notification: WebhookNotification
  ): Promise<void> {
    try {
      // Validate webhook signature
      const isValid = await this.validateWebhookSignature(request, notification)
      if (!isValid) {
        throw new Error('Invalid webhook signature')
      }

      // Check if webhook is registered
      const registeredWebhook = this.webhooks.get(notification.id)
      if (!registeredWebhook) {
        throw new Error('Webhook not registered')
      }

      // Check if webhook is still valid
      if (new Date(notification.expiration) < new Date()) {
        this.unregisterWebhook(notification.id)
        throw new Error('Webhook expired')
      }

      // Process the notification
      await this.handleWebhookNotification(notification)
    } catch (error) {
      console.error('Error processing webhook notification:', error)
      throw error
    }
  }

  // Validate webhook signature
  private async validateWebhookSignature(
    request: NextRequest,
    notification: WebhookNotification
  ): Promise<boolean> {
    try {
      const signature = request.headers.get('x-goog-signature')
      if (!signature) {
        return false
      }

      const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.warn('GOOGLE_WEBHOOK_SECRET not configured')
        return true // Allow in development
      }

      // Create HMAC signature
      const hmac = createHmac('sha256', webhookSecret)
      hmac.update(JSON.stringify(notification.body))
      const expectedSignature = hmac.digest('hex')

      return signature === expectedSignature
    } catch (error) {
      console.error('Error validating webhook signature:', error)
      return false
    }
  }

  // Handle webhook notification
  private async handleWebhookNotification(notification: WebhookNotification): Promise<void> {
    try {
      // Parse the notification body
      const body = notification.body
      
      if (body.type === 'sync') {
        await this.handleSyncNotification(notification)
      } else if (body.type === 'push') {
        await this.handlePushNotification(notification)
      }
    } catch (error) {
      console.error('Error handling webhook notification:', error)
      throw error
    }
  }

  // Handle sync notification
  private async handleSyncNotification(notification: WebhookNotification): Promise<void> {
    try {
      const event: WebhookEvent = {
        id: `sync-${Date.now()}`,
        type: 'updated',
        eventId: notification.resourceId,
        calendarId: 'primary',
        timestamp: new Date(),
        data: notification.body
      }

      // Call sync event handler
      const handler = this.eventHandlers.get('sync')
      if (handler) {
        await handler(event)
      }
    } catch (error) {
      console.error('Error handling sync notification:', error)
      throw error
    }
  }

  // Handle push notification
  private async handlePushNotification(notification: WebhookNotification): Promise<void> {
    try {
      const body = notification.body
      
      // Determine event type based on body content
      let eventType: 'created' | 'updated' | 'deleted' = 'updated'
      
      if (body.deleted) {
        eventType = 'deleted'
      } else if (body.created) {
        eventType = 'created'
      }

      const event: WebhookEvent = {
        id: `push-${Date.now()}`,
        type: eventType,
        eventId: body.eventId || notification.resourceId,
        calendarId: body.calendarId || 'primary',
        timestamp: new Date(),
        data: body
      }

      // Call push event handler
      const handler = this.eventHandlers.get('push')
      if (handler) {
        await handler(event)
      }
    } catch (error) {
      console.error('Error handling push notification:', error)
      throw error
    }
  }

  // Get all registered webhooks
  getRegisteredWebhooks(): WebhookNotification[] {
    return Array.from(this.webhooks.values())
  }

  // Get webhook by ID
  getWebhook(id: string): WebhookNotification | undefined {
    return this.webhooks.get(id)
  }

  // Check if webhook is registered
  isWebhookRegistered(id: string): boolean {
    return this.webhooks.has(id)
  }

  // Clean up expired webhooks
  cleanupExpiredWebhooks(): void {
    const now = new Date()
    
    for (const [id, webhook] of this.webhooks.entries()) {
      if (new Date(webhook.expiration) < now) {
        this.webhooks.delete(id)
        console.log(`Cleaned up expired webhook: ${id}`)
      }
    }
  }

  // Get webhook statistics
  getWebhookStats(): {
    totalWebhooks: number
    activeWebhooks: number
    expiredWebhooks: number
    eventHandlers: number
  } {
    const now = new Date()
    let activeWebhooks = 0
    let expiredWebhooks = 0

    for (const webhook of this.webhooks.values()) {
      if (new Date(webhook.expiration) < now) {
        expiredWebhooks++
      } else {
        activeWebhooks++
      }
    }

    return {
      totalWebhooks: this.webhooks.size,
      activeWebhooks,
      expiredWebhooks,
      eventHandlers: this.eventHandlers.size
    }
  }
}

// Global webhook manager instance
export const webhookManager = new GoogleCalendarWebhookManager()

// Clean up expired webhooks every hour
setInterval(() => {
  webhookManager.cleanupExpiredWebhooks()
}, 60 * 60 * 1000)

// Webhook event handlers
export class WebhookEventHandlers {
  // Handle sync events
  static async handleSyncEvent(event: WebhookEvent): Promise<void> {
    try {
      console.log('Sync event received:', event)
      
      // Implement sync logic here
      // This could trigger a full calendar sync
      // or update specific events based on the notification
      
      // Example: Trigger calendar sync
      // await calendarSyncService.syncCalendar(event.calendarId)
    } catch (error) {
      console.error('Error handling sync event:', error)
      throw error
    }
  }

  // Handle push events
  static async handlePushEvent(event: WebhookEvent): Promise<void> {
    try {
      console.log('Push event received:', event)
      
      // Implement push event logic here
      // This could update local events based on Google Calendar changes
      
      switch (event.type) {
        case 'created':
          // Handle event creation
          console.log('Event created:', event.eventId)
          break
        case 'updated':
          // Handle event update
          console.log('Event updated:', event.eventId)
          break
        case 'deleted':
          // Handle event deletion
          console.log('Event deleted:', event.eventId)
          break
      }
    } catch (error) {
      console.error('Error handling push event:', error)
      throw error
    }
  }
}

// Register default event handlers
webhookManager.registerEventHandler('sync', WebhookEventHandlers.handleSyncEvent)
webhookManager.registerEventHandler('push', WebhookEventHandlers.handlePushEvent)

// Utility functions
export function createWebhookNotification(
  id: string,
  resourceId: string,
  resourceUri: string,
  token: string,
  expiration: string,
  type: 'sync' | 'push',
  headers: Record<string, string>,
  body: any
): WebhookNotification {
  return {
    id,
    resourceId,
    resourceUri,
    token,
    expiration,
    type,
    headers,
    body,
    timestamp: new Date()
  }
}

export function validateWebhookRequest(request: NextRequest): boolean {
  try {
    // Check required headers
    const requiredHeaders = ['x-goog-resource-id', 'x-goog-resource-uri', 'x-goog-resource-state']
    
    for (const header of requiredHeaders) {
      if (!request.headers.get(header)) {
        console.warn(`Missing required header: ${header}`)
        return false
      }
    }

    // Check content type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Invalid content type:', contentType)
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating webhook request:', error)
    return false
  }
}
