import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { GoogleCalendarClient, CalendarEvent } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const lastSyncTime = searchParams.get('lastSyncTime')
    const maxResults = parseInt(searchParams.get('maxResults') || '100')

    // Create Google Calendar client
    const googleClient = new GoogleCalendarClient(
      user.profile?.google_access_token,
      user.profile?.google_refresh_token
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

    // Sync events from Google Calendar
    const events = await googleClient.syncEvents(
      lastSyncTime ? new Date(lastSyncTime) : undefined
    )

    return NextResponse.json({
      success: true,
      data: {
        events,
        count: events.length,
        lastSyncTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Get calendar events error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get calendar events' },
      { status: 500 }
    )
  }
}

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
    const { event } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Event data is required' },
        { status: 400 }
      )
    }

    // Create Google Calendar client
    const googleClient = new GoogleCalendarClient(
      user.profile?.google_access_token,
      user.profile?.google_refresh_token
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

    // Create event in Google Calendar
    const createdEvent = await googleClient.createEvent(event)

    return NextResponse.json({
      success: true,
      data: createdEvent
    })
  } catch (error) {
    console.error('Create calendar event error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { eventId, updates } = body

    if (!eventId || !updates) {
      return NextResponse.json(
        { error: 'Event ID and updates are required' },
        { status: 400 }
      )
    }

    // Create Google Calendar client
    const googleClient = new GoogleCalendarClient(
      user.profile?.google_access_token,
      user.profile?.google_refresh_token
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

    // Update event in Google Calendar
    const updatedEvent = await googleClient.updateEvent(eventId, updates)

    return NextResponse.json({
      success: true,
      data: updatedEvent
    })
  } catch (error) {
    console.error('Update calendar event error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Create Google Calendar client
    const googleClient = new GoogleCalendarClient(
      user.profile?.google_access_token,
      user.profile?.google_refresh_token
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

    // Delete event from Google Calendar
    await googleClient.deleteEvent(eventId)

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Delete calendar event error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}
