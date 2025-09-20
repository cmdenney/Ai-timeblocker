# Google Calendar Integration Guide

This guide covers the complete Google Calendar API integration for bidirectional sync in AI Timeblocker.

## Overview

The Google Calendar integration provides:
- Bidirectional synchronization with Google Calendar
- Real-time webhook notifications
- Batch operations for performance
- Conflict resolution and merge strategies
- Permission management
- Error handling and retry logic

## Quick Start

1. **Follow the setup guide:**
   - See [Google Calendar Setup Guide](./GOOGLE_CALENDAR_SETUP.md)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
   GOOGLE_CALENDAR_API_KEY=your-google-calendar-api-key
   GOOGLE_WEBHOOK_SECRET=your-webhook-secret
   GOOGLE_WEBHOOK_URL=https://yourdomain.com/api/calendar/webhook
   ```

4. **Test the integration:**
   ```bash
   npm run dev
   ```

## Core Components

### 1. Google Calendar Client

```typescript
import { GoogleCalendarClient } from '@/lib/google-calendar'

const client = new GoogleCalendarClient(accessToken, refreshToken)

// Create event
const event = await client.createEvent({
  title: 'Meeting with John',
  startTime: new Date('2024-01-16T14:00:00Z'),
  endTime: new Date('2024-01-16T15:00:00Z'),
  timeZone: 'UTC',
  location: 'Conference Room A'
})

// Sync events
const events = await client.syncEvents(lastSyncTime)
```

### 2. Bidirectional Sync

```typescript
import { syncManager } from '@/lib/google-calendar-sync'

const stats = await syncManager.startSync(googleClient, localEvents, {
  conflictResolution: 'merge',
  maxRetries: 3,
  batchSize: 100
})
```

### 3. Webhook Notifications

```typescript
import { webhookManager } from '@/lib/google-calendar-webhook'

// Register webhook
const webhook = await client.setupWebhook(webhookUrl)

// Process notifications
await webhookManager.processWebhookNotification(request, notification)
```

## API Endpoints

### Calendar Events

#### Get Events
**GET** `/api/calendar/events`

```json
{
  "success": true,
  "data": {
    "events": [...],
    "count": 10,
    "lastSyncTime": "2024-01-16T10:00:00Z"
  }
}
```

#### Create Event
**POST** `/api/calendar/events`

```json
{
  "event": {
    "title": "Meeting with John",
    "startTime": "2024-01-16T14:00:00Z",
    "endTime": "2024-01-16T15:00:00Z",
    "timeZone": "UTC",
    "location": "Conference Room A"
  }
}
```

#### Update Event
**PUT** `/api/calendar/events`

```json
{
  "eventId": "event-id-123",
  "updates": {
    "title": "Updated Meeting Title",
    "location": "New Location"
  }
}
```

#### Delete Event
**DELETE** `/api/calendar/events?eventId=event-id-123`

### Calendar Sync

#### Start Sync
**POST** `/api/calendar/sync`

```json
{
  "localEvents": [...],
  "conflictResolution": "merge",
  "maxRetries": 3,
  "batchSize": 100
}
```

#### Get Sync Status
**GET** `/api/calendar/sync`

```json
{
  "success": true,
  "data": {
    "syncStats": {
      "totalEvents": 50,
      "syncedEvents": 45,
      "conflictedEvents": 3,
      "failedEvents": 2,
      "lastSyncTime": "2024-01-16T10:00:00Z",
      "syncDuration": 1500
    },
    "conflicts": [...],
    "isSyncInProgress": false
  }
}
```

### Batch Operations

#### Execute Batch
**POST** `/api/calendar/batch`

```json
{
  "operations": [
    {
      "id": "op-1",
      "type": "create",
      "event": { ... }
    },
    {
      "id": "op-2",
      "type": "update",
      "eventId": "event-123",
      "updates": { ... }
    },
    {
      "id": "op-3",
      "type": "delete",
      "eventId": "event-456"
    }
  ]
}
```

### Permissions Management

#### List Permissions
**GET** `/api/calendar/permissions?calendarId=primary`

#### Grant Permission
**POST** `/api/calendar/permissions`

```json
{
  "permissionRequest": {
    "calendarId": "primary",
    "role": "writer",
    "scope": {
      "type": "user",
      "value": "user@example.com"
    },
    "sendNotifications": true
  }
}
```

#### Update Permission
**PUT** `/api/calendar/permissions`

```json
{
  "calendarId": "primary",
  "permissionId": "permission-123",
  "newRole": "reader"
}
```

#### Revoke Permission
**DELETE** `/api/calendar/permissions?calendarId=primary&permissionId=permission-123`

### Webhook Notifications

#### Webhook Endpoint
**POST** `/api/calendar/webhook`

Handles real-time notifications from Google Calendar.

#### Webhook Status
**GET** `/api/calendar/webhook`

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalWebhooks": 5,
      "activeWebhooks": 4,
      "expiredWebhooks": 1,
      "eventHandlers": 2
    },
    "webhooks": [...]
  }
}
```

## Conflict Resolution

### Conflict Types

1. **Concurrent Edit**: Event modified in both local and remote calendars
2. **Deleted Modified**: Event deleted remotely but modified locally
3. **Permission Denied**: Insufficient permissions for operation
4. **Quota Exceeded**: API quota limits reached

### Resolution Strategies

#### Local Wins
```typescript
const stats = await syncManager.startSync(googleClient, localEvents, {
  conflictResolution: 'local_wins'
})
```

#### Remote Wins
```typescript
const stats = await syncManager.startSync(googleClient, localEvents, {
  conflictResolution: 'remote_wins'
})
```

#### Merge
```typescript
const stats = await syncManager.startSync(googleClient, localEvents, {
  conflictResolution: 'merge'
})
```

#### Manual Resolution
```typescript
const stats = await syncManager.startSync(googleClient, localEvents, {
  conflictResolution: 'manual'
})

// Get conflicts for manual resolution
const conflicts = syncManager.getConflicts()

// Resolve conflict manually
await syncManager.resolveConflictManually(conflictId, 'local_wins')
```

## Webhook Configuration

### Setting Up Webhooks

1. **Create webhook endpoint:**
   ```typescript
   const webhook = await client.setupWebhook('https://yourdomain.com/api/calendar/webhook')
   ```

2. **Handle webhook notifications:**
   ```typescript
   // Register event handlers
   webhookManager.registerEventHandler('sync', handleSyncEvent)
   webhookManager.registerEventHandler('push', handlePushEvent)
   ```

3. **Process notifications:**
   ```typescript
   await webhookManager.processWebhookNotification(request, notification)
   ```

### Webhook Security

```typescript
// Validate webhook signature
const isValid = await validateWebhookRequest(request)
if (!isValid) {
  return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
}
```

## Batch Operations

### Performance Optimization

```typescript
import { GoogleCalendarBatchClient } from '@/lib/google-calendar'

const batchClient = new GoogleCalendarBatchClient(googleClient)

// Add operations
batchClient.addCreateOperation('op-1', event1)
batchClient.addUpdateOperation('op-2', eventId, updates)
batchClient.addDeleteOperation('op-3', eventId)

// Execute batch
const results = await batchClient.executeBatch()
```

### Batch Limits

- Maximum 100 operations per batch
- Maximum 2500 events per request
- Rate limit: 1000 requests per minute
- Daily limit: 1,000,000 requests

## Error Handling

### Retry Logic

```typescript
import { withRetry } from '@/lib/google-calendar-retry'

const result = await withRetry(
  () => client.createEvent(event),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
)
```

### Circuit Breaker

```typescript
import { circuitBreaker } from '@/lib/google-calendar-retry'

const result = await circuitBreaker.execute(
  () => client.createEvent(event)
)
```

### Error Types

```typescript
import { GoogleCalendarError } from '@/lib/google-calendar'

try {
  await client.createEvent(event)
} catch (error) {
  if (error instanceof GoogleCalendarError) {
    console.log(`Error: ${error.message}, Code: ${error.code}`)
    console.log(`Retryable: ${error.retryable}`)
  }
}
```

## Permission Management

### Granting Permissions

```typescript
import { permissionsManager, createUserPermissionRequest } from '@/lib/google-calendar-permissions'

// Create permission request
const request = createUserPermissionRequest(
  'primary',
  'user@example.com',
  'writer',
  { sendNotifications: true }
)

// Grant permission
const permission = await permissionsManager.grantPermission(googleClient, request)
```

### Checking Permissions

```typescript
// Check if user has permission
const hasPermission = permissionsManager.hasPermission(
  'primary',
  'user@example.com',
  'writer'
)

// Get user's role
const role = permissionsManager.getUserRole('primary', 'user@example.com')
```

### Permission Roles

- **Owner**: Full access, can manage permissions
- **Writer**: Can create, update, and delete events
- **Reader**: Can view events only
- **FreeBusyReader**: Can view free/busy information only

## Testing

### Unit Tests

```typescript
import { GoogleCalendarClient } from '@/lib/google-calendar'

test('creates calendar event', async () => {
  const client = new GoogleCalendarClient('token', 'refresh')
  const event = await client.createEvent({
    title: 'Test Event',
    startTime: new Date(),
    endTime: new Date(),
    timeZone: 'UTC'
  })
  
  expect(event.id).toBeDefined()
  expect(event.summary).toBe('Test Event')
})
```

### Integration Tests

```typescript
test('syncs events bidirectionally', async () => {
  const stats = await syncManager.startSync(googleClient, localEvents)
  
  expect(stats.syncedEvents).toBeGreaterThan(0)
  expect(stats.conflictedEvents).toBe(0)
})
```

### Webhook Testing

```bash
# Use ngrok for local testing
ngrok http 3000

# Test webhook endpoint
curl -X POST https://yourdomain.com/api/calendar/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Production Deployment

### Environment Variables

```env
# Production configuration
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google
GOOGLE_WEBHOOK_URL=https://yourdomain.com/api/calendar/webhook
GOOGLE_WEBHOOK_SECRET=your-production-webhook-secret
```

### SSL Certificate

- Ensure valid SSL certificate for webhook endpoints
- Use Let's Encrypt for free certificates
- Configure automatic renewal

### Monitoring

- Set up Google Cloud Monitoring
- Monitor API quota usage
- Track webhook delivery success
- Set up alerts for failures

### Rate Limiting

```typescript
// Implement rate limiting
const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  max: 1000 // 1000 requests per minute
})
```

## Troubleshooting

### Common Issues

1. **OAuth Token Expired**
   - Implement automatic token refresh
   - Handle refresh failures gracefully

2. **Webhook Not Working**
   - Verify HTTPS endpoint
   - Check webhook secret configuration
   - Test with Google's webhook testing tool

3. **Sync Conflicts**
   - Review conflict resolution strategy
   - Implement manual conflict resolution
   - Monitor conflict patterns

4. **API Quota Exceeded**
   - Implement exponential backoff
   - Use batch operations
   - Monitor quota usage

### Debug Mode

```env
GOOGLE_DEBUG=true
GOOGLE_LOG_LEVEL=debug
```

### Logging

```typescript
// Enable detailed logging
console.log('Google Calendar API call:', {
  method: 'createEvent',
  eventId: event.id,
  timestamp: new Date()
})
```

## Security Considerations

### API Key Security
- Store API keys in environment variables
- Use server-side only for API calls
- Implement rate limiting per user
- Monitor usage and costs

### OAuth Security
- Use HTTPS for all redirect URIs
- Implement CSRF protection
- Validate state parameter
- Store tokens securely

### Webhook Security
- Verify webhook signatures
- Implement rate limiting
- Use HTTPS endpoints
- Validate request origin

## Support

For additional help:
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
