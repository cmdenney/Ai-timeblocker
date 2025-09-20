import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { GoogleCalendarClient, GoogleCalendarBatchClient } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.profile?.google_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar access not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { operations } = body

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations array is required' },
        { status: 400 }
      )
    }

    // Create Google Calendar client
    const googleClient = new GoogleCalendarClient(
      user.profile.google_access_token,
      user.profile.google_refresh_token
    )

    // Check if token is valid
    const isTokenValid = await googleClient.isTokenValid()
    if (!isTokenValid) {
      try {
        await googleClient.refreshAccessToken()
      } catch (error) {
        return NextResponse.json(
          { error: 'Google Calendar access expired and could not be refreshed' },
          { status: 401 }
        )
      }
    }

    // Create batch client
    const batchClient = new GoogleCalendarBatchClient(googleClient)

    // Add operations to batch
    for (const operation of operations) {
      const { id, type, event, eventId, updates } = operation

      switch (type) {
        case 'create':
          if (!event) {
            throw new Error(`Event data required for create operation: ${id}`)
          }
          batchClient.addCreateOperation(id, event)
          break

        case 'update':
          if (!eventId || !updates) {
            throw new Error(`Event ID and updates required for update operation: ${id}`)
          }
          batchClient.addUpdateOperation(id, eventId, updates)
          break

        case 'delete':
          if (!eventId) {
            throw new Error(`Event ID required for delete operation: ${id}`)
          }
          batchClient.addDeleteOperation(id, eventId)
          break

        default:
          throw new Error(`Unknown operation type: ${type}`)
      }
    }

    // Execute batch operations
    const results = await batchClient.executeBatch()

    // Calculate statistics
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      data: {
        results,
        statistics: {
          total: results.length,
          successful,
          failed,
          successRate: results.length > 0 ? (successful / results.length) * 100 : 0
        }
      }
    })
  } catch (error) {
    console.error('Batch operations error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to execute batch operations' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return batch operation capabilities and limits
    return NextResponse.json({
      success: true,
      data: {
        capabilities: {
          create: true,
          update: true,
          delete: true,
          batchSize: 100, // Maximum operations per batch
          supportedEventFields: [
            'title',
            'description',
            'startTime',
            'endTime',
            'timeZone',
            'location',
            'recurrence',
            'attendees',
            'reminders',
            'visibility',
            'status'
          ]
        },
        limits: {
          maxOperationsPerBatch: 100,
          maxEventsPerRequest: 2500,
          rateLimitPerMinute: 1000,
          rateLimitPerDay: 1000000
        }
      }
    })
  } catch (error) {
    console.error('Get batch capabilities error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get batch capabilities' },
      { status: 500 }
    )
  }
}
