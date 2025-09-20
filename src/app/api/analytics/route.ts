import { NextRequest, NextResponse } from 'next/server'
import { getEventStats, getChatStats } from '@/lib/db-operations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'events'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate ? new Date(endDate) : new Date()

    let stats
    if (type === 'events') {
      stats = await getEventStats(userId, start, end)
    } else if (type === 'chat') {
      stats = await getChatStats(userId, start, end)
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Use "events" or "chat"' },
        { status: 400 }
      )
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
