import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { chatHistoryManager } from '@/lib/chat-history'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Check if session belongs to user
    const session = chatHistoryManager.getSession(sessionId)
    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Get threads for session
    const threads = chatHistoryManager.getThreadsBySession(sessionId)
      .slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        threads,
        pagination: {
          total: threads.length,
          limit,
          offset,
          hasMore: threads.length === limit
        }
      }
    })
  } catch (error) {
    console.error('Get threads error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get threads' },
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

    const body = await request.json()
    const { sessionId, parentId, metadata } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Check if session belongs to user
    const session = chatHistoryManager.getSession(sessionId)
    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Create new thread
    const thread = chatHistoryManager.createThread(sessionId, parentId)

    // Update metadata if provided
    if (metadata) {
      chatHistoryManager.updateThread(thread.id, { metadata })
    }

    return NextResponse.json({
      success: true,
      data: thread
    })
  } catch (error) {
    console.error('Create thread error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create thread' },
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

    const body = await request.json()
    const { threadId, updates } = body

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      )
    }

    // Get thread
    const thread = chatHistoryManager.getThread(threadId)
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this thread
    const session = chatHistoryManager.getSession(thread.sessionId)
    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      )
    }

    // Update thread
    const updatedThread = chatHistoryManager.updateThread(threadId, updates)
    if (!updatedThread) {
      return NextResponse.json(
        { error: 'Failed to update thread' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedThread
    })
  } catch (error) {
    console.error('Update thread error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update thread' },
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

    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      )
    }

    // Get thread
    const thread = chatHistoryManager.getThread(threadId)
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this thread
    const session = chatHistoryManager.getSession(thread.sessionId)
    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      )
    }

    // Delete thread
    const deleted = chatHistoryManager.deleteThread(threadId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Thread deleted successfully'
    })
  } catch (error) {
    console.error('Delete thread error:', error)
    
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    )
  }
}
