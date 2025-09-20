import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/supabase/auth'
import { UserService } from '@/lib/supabase/services/users'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await AuthService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (currentUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, timezone, working_hours, preferences } = body

    const updatedUser = await UserService.updateUser(id, {
      full_name,
      timezone,
      working_hours,
      preferences,
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
