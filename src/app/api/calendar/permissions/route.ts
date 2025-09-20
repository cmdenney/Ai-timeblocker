import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { GoogleCalendarClient } from '@/lib/google-calendar'
import { permissionsManager, PermissionValidator } from '@/lib/google-calendar-permissions'

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
    const calendarId = searchParams.get('calendarId') || 'primary'

    // Validate calendar ID
    if (!PermissionValidator.isValidCalendarId(calendarId)) {
      return NextResponse.json(
        { error: 'Invalid calendar ID' },
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

    // List permissions
    const permissions = await permissionsManager.listPermissions(googleClient, calendarId)

    return NextResponse.json({
      success: true,
      data: {
        permissions,
        count: permissions.length,
        calendarId
      }
    })
  } catch (error) {
    console.error('Get calendar permissions error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get calendar permissions' },
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
    const { permissionRequest } = body

    if (!permissionRequest) {
      return NextResponse.json(
        { error: 'Permission request is required' },
        { status: 400 }
      )
    }

    // Validate permission request
    try {
      const validatedRequest = PermissionValidator.validatePermissionRequest(permissionRequest)
      
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

      // Grant permission
      const permission = await permissionsManager.grantPermission(googleClient, validatedRequest)

      return NextResponse.json({
        success: true,
        data: permission
      })
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid permission request', details: validationError },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Grant calendar permission error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to grant calendar permission' },
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
    const { calendarId, permissionId, newRole } = body

    if (!calendarId || !permissionId || !newRole) {
      return NextResponse.json(
        { error: 'Calendar ID, permission ID, and new role are required' },
        { status: 400 }
      )
    }

    // Validate inputs
    if (!PermissionValidator.isValidCalendarId(calendarId)) {
      return NextResponse.json(
        { error: 'Invalid calendar ID' },
        { status: 400 }
      )
    }

    if (!PermissionValidator.isValidRole(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
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

    // Update permission
    const updatedPermission = await permissionsManager.updatePermission(
      googleClient,
      calendarId,
      permissionId,
      newRole
    )

    return NextResponse.json({
      success: true,
      data: updatedPermission
    })
  } catch (error) {
    console.error('Update calendar permission error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update calendar permission' },
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
    const calendarId = searchParams.get('calendarId')
    const permissionId = searchParams.get('permissionId')

    if (!calendarId || !permissionId) {
      return NextResponse.json(
        { error: 'Calendar ID and permission ID are required' },
        { status: 400 }
      )
    }

    // Validate calendar ID
    if (!PermissionValidator.isValidCalendarId(calendarId)) {
      return NextResponse.json(
        { error: 'Invalid calendar ID' },
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

    // Revoke permission
    await permissionsManager.revokePermission(googleClient, calendarId, permissionId)

    return NextResponse.json({
      success: true,
      message: 'Permission revoked successfully'
    })
  } catch (error) {
    console.error('Revoke calendar permission error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to revoke calendar permission' },
      { status: 500 }
    )
  }
}
