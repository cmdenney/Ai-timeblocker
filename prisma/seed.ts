import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'demo@ai-timeblocker.com' },
    update: {},
    create: {
      email: 'demo@ai-timeblocker.com',
      name: 'Demo User',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    },
  })

  console.log('✅ Created user:', user.email)

  // Create user preferences
  const preferences = await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      timeZone: 'America/New_York',
      timeFormat: '12h',
      weekStartsOn: 1, // Monday
      workingHours: {
        start: '09:00',
        end: '17:00',
      },
      defaultDuration: 60,
      aiSuggestions: true,
      autoSchedule: false,
    },
  })

  console.log('✅ Created user preferences')

  // Create sample events
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const events = [
    {
      title: 'Team Standup',
      description: 'Daily team synchronization meeting',
      startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
      endTime: new Date(today.getTime() + 9 * 30 * 60 * 1000), // 9:30 AM
      location: 'Conference Room A',
      color: '#3b82f6',
      createdByAI: false,
    },
    {
      title: 'Deep Work Session',
      description: 'Focused coding time for AI Timeblocker features',
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
      endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
      color: '#10b981',
      createdByAI: true,
      confidence: 0.95,
      originalPrompt: 'Schedule 2 hours of deep work for coding',
    },
    {
      title: 'Lunch Break',
      description: 'Personal time for lunch and relaxation',
      startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
      endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1:00 PM
      color: '#f59e0b',
      createdByAI: true,
      confidence: 0.88,
      originalPrompt: 'Add a lunch break',
    },
    {
      title: 'Client Meeting',
      description: 'Discuss project requirements with client',
      startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
      endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM
      location: 'Zoom Meeting',
      color: '#8b5cf6',
      createdByAI: false,
    },
    {
      title: 'Code Review',
      description: 'Review pull requests and provide feedback',
      startTime: new Date(today.getTime() + 15 * 30 * 60 * 1000), // 3:30 PM
      endTime: new Date(today.getTime() + 16 * 30 * 60 * 1000), // 4:30 PM
      color: '#06b6d4',
      createdByAI: true,
      confidence: 0.92,
      originalPrompt: 'Schedule time for code review',
    },
  ]

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        userId: user.id,
      },
    })
    console.log(`✅ Created event: ${event.title}`)
  }

  // Create a chat session
  const chatSession = await prisma.chatSession.create({
    data: {
      userId: user.id,
      title: 'AI Timeblocker Assistant',
      isActive: true,
    },
  })

  console.log('✅ Created chat session')

  // Create sample chat messages
  const messages = [
    {
      content: 'Hello! I\'m your AI Timeblocker assistant. I can help you optimize your schedule, create time blocks, and provide insights about your productivity patterns.',
      role: 'assistant',
      metadata: {
        type: 'greeting',
        timestamp: new Date().toISOString(),
      },
    },
    {
      content: 'Can you help me schedule a focus session for tomorrow?',
      role: 'user',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    {
      content: 'Absolutely! I can see you have a free slot tomorrow from 2:00 PM to 4:00 PM. Would you like me to create a 2-hour focus session during that time?',
      role: 'assistant',
      metadata: {
        type: 'suggestion',
        suggestedEvents: [
          {
            title: 'Focus Session',
            startTime: '2024-01-16T14:00:00Z',
            endTime: '2024-01-16T16:00:00Z',
            confidence: 0.95,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    },
    {
      content: 'Yes, please create that focus session.',
      role: 'user',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    {
      content: 'Perfect! I\'ve created a 2-hour focus session for tomorrow from 2:00 PM to 4:00 PM. The event has been added to your calendar.',
      role: 'assistant',
      metadata: {
        type: 'confirmation',
        createdEvent: {
          id: 'event_123',
          title: 'Focus Session',
          startTime: '2024-01-16T14:00:00Z',
          endTime: '2024-01-16T16:00:00Z',
        },
        timestamp: new Date().toISOString(),
      },
    },
  ]

  for (const messageData of messages) {
    const message = await prisma.chatMessage.create({
      data: {
        ...messageData,
        sessionId: chatSession.id,
      },
    })
    console.log(`✅ Created message: ${message.role}`)
  }

  // Create a calendar connection (demo)
  const calendarConnection = await prisma.calendarConnection.create({
    data: {
      userId: user.id,
      provider: 'google',
      accessToken: 'demo_access_token',
      refreshToken: 'demo_refresh_token',
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      calendarId: 'primary',
      timeZone: 'America/New_York',
    },
  })

  console.log('✅ Created calendar connection')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
