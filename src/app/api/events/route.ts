import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/lib/supabase/services/events'
import { AuthService } from '@/lib/supabase/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      category: category || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    }

    const events = await EventService.getEvents(user.id, options)
    
    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const event = await EventService.createEvent({
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      start_time: body.startTime,
      end_time: body.endTime,
      is_all_day: body.isAllDay || false,
      location: body.location || null,
      category: body.category || 'other',
      priority: body.priority || 'medium',
      color: body.color || null,
      recurrence_rule: body.recurrence?.rule || null,
      recurrence_pattern: body.recurrence?.pattern || null,
      attendees: body.attendees || null,
      metadata: body.metadata || null
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}