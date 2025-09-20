import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdvancedNLPSystem, createDefaultNLPSystemConfig } from '@/lib/nlp/nlp-system'
import { EventInfo } from '@/lib/nlp/conflict-detector'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      input, 
      timezone = 'UTC',
      existingEvents = [],
      options = {}
    } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required and must be a string' },
        { status: 400 }
      )
    }

    // Create NLP system with user-specific configuration
    const config = createDefaultNLPSystemConfig(timezone)
    
    // Update user patterns based on user data if available
    if (user.profile?.preferences) {
      config.userPatterns = {
        ...config.userPatterns,
        ...(user.profile.preferences as Record<string, any>)
      }
    }

    const nlpSystem = createAdvancedNLPSystem(config)

    // Validate input
    const validation = nlpSystem.validateInput(input)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    // Convert existing events to EventInfo format
    const eventInfos: EventInfo[] = existingEvents.map((event: any) => ({
      id: event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title || 'Untitled Event',
      startTime: new Date(event.startTime || event.startDate),
      endTime: new Date(event.endTime || event.endDate),
      location: event.location,
      isAllDay: event.isAllDay || false,
      category: event.category || 'other',
      priority: event.priority || 'medium',
      energyLevel: event.energyLevel || 'medium',
      attendees: event.attendees || [],
      resources: event.resources || [],
      estimatedTravelTime: event.estimatedTravelTime
    }))

    // Analyze the input
    const analysis = await nlpSystem.analyzeScheduleInput(
      input,
      eventInfos,
      {
        context: options.context,
        userPreferences: user.profile?.preferences as Record<string, any>,
        workingHours: options.workingHours
      }
    )

    return NextResponse.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('NLP analysis error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze schedule input' },
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

    // Return system information
    const config = createDefaultNLPSystemConfig()
    const nlpSystem = createAdvancedNLPSystem(config)
    const stats = nlpSystem.getSystemStats()

    return NextResponse.json({
      success: true,
      data: {
        system: stats,
        capabilities: {
          conflictDetection: true,
          confidenceScoring: true,
          recurrenceParsing: true,
          timezoneHandling: true,
          patternRecognition: true
        },
        supportedTimezones: [
          'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
          'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
          'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'
        ]
      }
    })
  } catch (error) {
    console.error('NLP system info error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get system information' },
      { status: 500 }
    )
  }
}
