import { NextRequest, NextResponse } from 'next/server'
import { getUserPreferences, updateUserPreferences } from '@/lib/db-operations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    const preferences = await getUserPreferences(userId)

    if (!preferences) {
      return NextResponse.json(
        { error: 'User preferences not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const body = await request.json()

    const preferences = await updateUserPreferences(userId, body)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    )
  }
}
