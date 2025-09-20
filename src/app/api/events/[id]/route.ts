import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/lib/supabase/services/events'
import { AuthService } from '@/lib/supabase/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const event = await EventService.getEvent(id)
    
    // Check if user owns this event
    if (event.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    // Check if user owns this event
    const existingEvent = await EventService.getEvent(id)
    if (existingEvent.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const event = await EventService.updateEvent(id, {
      title: body.title,
      description: body.description,
      start_time: body.startTime,
      end_time: body.endTime,
      is_all_day: body.isAllDay,
      location: body.location,
      category: body.category,
      priority: body.priority,
      color: body.color,
      recurrence_rule: body.recurrence?.rule,
      recurrence_pattern: body.recurrence?.pattern,
      attendees: body.attendees,
      metadata: body.metadata
    })

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if user owns this event
    const existingEvent = await EventService.getEvent(id)
    if (existingEvent.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await EventService.deleteEvent(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}