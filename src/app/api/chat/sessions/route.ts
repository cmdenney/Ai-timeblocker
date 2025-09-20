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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's chat sessions
    const sessions = chatHistoryManager.getSessionsByUser(user.id)
      .slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total: sessions.length,
          limit,
          offset,
          hasMore: sessions.length === limit
        }
      }
    })
  } catch (error) {
    console.error('Get chat sessions error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get chat sessions' },
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
    const { title, metadata } = body

    // Create new chat session
    const session = chatHistoryManager.createSession(
      user.id,
      title || 'New Chat'
    )

    // Update metadata if provided
    if (metadata) {
      chatHistoryManager.updateSession(session.id, { metadata })
    }

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('Create chat session error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create chat session' },
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
    const { sessionId, updates } = body

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

    // Update session
    const updatedSession = chatHistoryManager.updateSession(sessionId, updates)
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedSession
    })
  } catch (error) {
    console.error('Update chat session error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update chat session' },
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
    const sessionId = searchParams.get('sessionId')

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

    // Delete session
    const deleted = chatHistoryManager.deleteSession(sessionId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })
  } catch (error) {
    console.error('Delete chat session error:', error)
    
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    )
  }
}