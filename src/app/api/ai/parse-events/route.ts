import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { parseCalendarEventsWithRetry } from '@/lib/openai-retry'
import { contextManager } from '@/lib/conversation-context'
import { tokenTracker } from '@/lib/token-tracking'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userInput, timezone = 'UTC' } = body

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      )
    }

    // Get user context
    const context = await contextManager.getContext(
      user.id,
      timezone,
      (user.profile?.preferences as Record<string, any>) || {},
      [] // Events will be loaded separately if needed
    )

    // Parse calendar events
    const result = await parseCalendarEventsWithRetry(
      userInput,
      timezone,
      {
        currentDate: context.currentDate,
        workingHours: context.workingHours,
        existingEvents: context.recentEvents,
        preferences: context.userPreferences
      }
    )

    // Add message to conversation history
    contextManager.addMessage(
      context.id,
      'user',
      userInput,
      { type: 'calendar_parse_request' }
    )

    contextManager.addMessage(
      context.id,
      'assistant',
      result.message,
      { 
        type: 'calendar_parse_response',
        events: result.events,
        metadata: result.metadata
      }
    )

    // Update session data
    if (result.metadata) {
      contextManager.updateSessionData(
        context.id,
        result.metadata.tokens,
        result.metadata.cost
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Parse events error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to parse calendar events' },
      { status: 500 }
    )
  }
}
