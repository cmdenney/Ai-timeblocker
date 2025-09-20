import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { GoogleCalendarClient } from '@/lib/google-calendar'
import { syncManager } from '@/lib/google-calendar-sync'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has Google Calendar access
    if (!user.profile?.google_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar access not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      localEvents = [],
      conflictResolution = 'merge',
      maxRetries = 3,
      batchSize = 100
    } = body

    // Create Google Calendar client
    const googleClient = new GoogleCalendarClient(
      user.profile?.google_access_token,
      user.profile?.google_refresh_token
    )

    // Check if token is valid
    const isTokenValid = await googleClient.isTokenValid()
    if (!isTokenValid) {
      // Try to refresh token
      try {
        const { accessToken, refreshToken } = await googleClient.refreshAccessToken()
        
        // Update user tokens in database
        // This would typically be done through a user service
        console.log('Token refreshed successfully')
      } catch (error) {
        return NextResponse.json(
          { error: 'Google Calendar access expired and could not be refreshed' },
          { status: 401 }
        )
      }
    }

    // Start sync
    const syncStats = await syncManager.startSync(googleClient, localEvents, {
      conflictResolution,
      maxRetries,
      batchSize
    })

    return NextResponse.json({
      success: true,
      data: syncStats
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
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

    // Get sync statistics
    const syncStats = syncManager.getSyncStats()
    const conflicts = syncManager.getConflicts()

    return NextResponse.json({
      success: true,
      data: {
        syncStats,
        conflicts,
        isSyncInProgress: syncManager.isSyncInProgress(),
        lastSyncTime: syncManager.getLastSyncTime()
      }
    })
  } catch (error) {
    console.error('Get sync stats error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get sync statistics' },
      { status: 500 }
    )
  }
}
