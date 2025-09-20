import { db } from './db'
import type { User, Event, ChatSession, ChatMessage, CalendarConnection, UserPreference } from '@prisma/client'

// User operations
export async function getUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
    include: {
      preferences: true,
      events: {
        orderBy: { startTime: 'asc' },
      },
      chatSessions: {
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      },
      calendarConnections: true,
    },
  })
}

export async function createUser(data: {
  email: string
  name?: string
  image?: string
}) {
  return await db.user.create({
    data,
    include: {
      preferences: true,
    },
  })
}

export async function updateUser(id: string, data: Partial<User>) {
  return await db.user.update({
    where: { id },
    data,
  })
}

// Event operations
export async function getEventsByUserId(userId: string, options?: {
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const where: any = { userId }
  
  if (options?.startDate || options?.endDate) {
    where.startTime = {}
    if (options.startDate) where.startTime.gte = options.startDate
    if (options.endDate) where.startTime.lte = options.endDate
  }

  return await db.event.findMany({
    where,
    orderBy: { startTime: 'asc' },
    take: options?.limit,
  })
}

export async function createEvent(data: {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay?: boolean
  recurrence?: string
  location?: string
  color?: string
  googleEventId?: string
  outlookEventId?: string
  createdByAI?: boolean
  confidence?: number
  originalPrompt?: string
  userId: string
}) {
  return await db.event.create({
    data,
  })
}

export async function updateEvent(id: string, data: Partial<Event>) {
  return await db.event.update({
    where: { id },
    data,
  })
}

export async function deleteEvent(id: string) {
  return await db.event.delete({
    where: { id },
  })
}

export async function getEventsByDateRange(userId: string, startDate: Date, endDate: Date) {
  return await db.event.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { startTime: 'asc' },
  })
}

// Chat operations
export async function getChatSessionsByUserId(userId: string, limit = 10) {
  return await db.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1, // Get only the first message for preview
      },
    },
  })
}

export async function getChatSessionWithMessages(sessionId: string) {
  return await db.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function createChatSession(userId: string, title?: string) {
  return await db.chatSession.create({
    data: {
      userId,
      title,
    },
  })
}

export async function addMessageToSession(sessionId: string, data: {
  content: string
  role: 'user' | 'assistant' | 'system'
  metadata?: any
}) {
  return await db.chatMessage.create({
    data: {
      ...data,
      sessionId,
    },
  })
}

export async function updateChatSession(id: string, data: Partial<ChatSession>) {
  return await db.chatSession.update({
    where: { id },
    data,
  })
}

// Calendar connection operations
export async function getCalendarConnectionsByUserId(userId: string) {
  return await db.calendarConnection.findMany({
    where: { userId },
  })
}

export async function createCalendarConnection(data: {
  userId: string
  provider: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  calendarId?: string
  timeZone?: string
}) {
  return await db.calendarConnection.create({
    data,
  })
}

export async function updateCalendarConnection(id: string, data: Partial<CalendarConnection>) {
  return await db.calendarConnection.update({
    where: { id },
    data,
  })
}

export async function deleteCalendarConnection(id: string) {
  return await db.calendarConnection.delete({
    where: { id },
  })
}

// User preferences operations
export async function getUserPreferences(userId: string) {
  return await db.userPreference.findUnique({
    where: { userId },
  })
}

export async function createUserPreferences(data: {
  userId: string
  timeZone?: string
  timeFormat?: string
  weekStartsOn?: number
  workingHours?: any
  defaultDuration?: number
  aiSuggestions?: boolean
  autoSchedule?: boolean
}) {
  return await db.userPreference.create({
    data,
  })
}

export async function updateUserPreferences(userId: string, data: Partial<UserPreference>) {
  return await db.userPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  })
}

// Analytics operations
export async function getEventStats(userId: string, startDate: Date, endDate: Date) {
  const events = await db.event.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  const totalEvents = events.length
  const aiCreatedEvents = events.filter(e => e.createdByAI).length
  const totalDuration = events.reduce((acc, event) => {
    const duration = event.endTime.getTime() - event.startTime.getTime()
    return acc + duration
  }, 0)

  const averageConfidence = events
    .filter(e => e.confidence !== null)
    .reduce((acc, event) => acc + (event.confidence || 0), 0) / 
    events.filter(e => e.confidence !== null).length || 0

  return {
    totalEvents,
    aiCreatedEvents,
    totalDuration,
    averageConfidence,
    eventsByCategory: events.reduce((acc, event) => {
      const category = event.color || 'default'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
}

export async function getChatStats(userId: string, startDate: Date, endDate: Date) {
  const sessions = await db.chatSession.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      messages: true,
    },
  })

  const totalSessions = sessions.length
  const totalMessages = sessions.reduce((acc, session) => acc + session.messages.length, 0)
  const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0

  return {
    totalSessions,
    totalMessages,
    averageMessagesPerSession,
  }
}

// Utility functions
export async function getUpcomingEvents(userId: string, limit = 5) {
  const now = new Date()
  return await db.event.findMany({
    where: {
      userId,
      startTime: {
        gte: now,
      },
    },
    orderBy: { startTime: 'asc' },
    take: limit,
  })
}

export async function getTodaysEvents(userId: string) {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  
  return await db.event.findMany({
    where: {
      userId,
      startTime: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: { startTime: 'asc' },
  })
}

export async function searchEvents(userId: string, query: string) {
  return await db.event.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { startTime: 'asc' },
  })
}
