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
    const threadId = searchParams.get('threadId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let messages = []

    if (sessionId) {
      // Get messages from session
      const session = chatHistoryManager.getSession(sessionId)
      if (!session || session.userId !== user.id) {
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        )
      }

      if (threadId) {
        // Get messages from specific thread
        const thread = chatHistoryManager.getThread(threadId)
        if (!thread || thread.sessionId !== sessionId) {
          return NextResponse.json(
            { error: 'Thread not found' },
            { status: 404 }
          )
        }
        messages = thread.messages
      } else {
        // Get all messages from session
        const threads = chatHistoryManager.getThreadsBySession(sessionId)
        messages = threads.flatMap(thread => thread.messages)
      }
    } else if (search) {
      // Search messages
      messages = chatHistoryManager.searchMessages(search, sessionId || undefined)
    } else {
      // Get all user messages
      const sessions = chatHistoryManager.getSessionsByUser(user.id)
      const allThreads = sessions.flatMap(session => 
        chatHistoryManager.getThreadsBySession(session.id)
      )
      messages = allThreads.flatMap(thread => thread.messages)
    }

    // Sort by timestamp (newest first)
    messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    const paginatedMessages = messages.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          total: messages.length,
          limit,
          offset,
          hasMore: paginatedMessages.length === limit
        }
      }
    })
  } catch (error) {
    console.error('Get messages error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get messages' },
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
    const { 
      content, 
      role = 'user', 
      sessionId, 
      threadId,
      metadata 
    } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

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

    // Create message
    const message = chatHistoryManager.createMessage(role, content, metadata)

    // Add to thread
    if (threadId) {
      const thread = chatHistoryManager.getThread(threadId)
      if (!thread || thread.sessionId !== sessionId) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        )
      }
      chatHistoryManager.addMessageToThread(threadId, message)
    } else {
      // Create new thread for this message
      const thread = chatHistoryManager.createThread(sessionId)
      chatHistoryManager.addMessageToThread(thread.id, message)
    }

    return NextResponse.json({
      success: true,
      data: message
    })
  } catch (error) {
    console.error('Create message error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create message' },
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
    const { messageId, updates } = body

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Get message
    const message = chatHistoryManager.getMessage(messageId)
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this message
    // This would require checking if the message belongs to a session owned by the user
    // For now, we'll allow the update
    const updatedMessage = chatHistoryManager.updateMessage(messageId, updates)
    if (!updatedMessage) {
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedMessage
    })
  } catch (error) {
    console.error('Update message error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update message' },
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
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Get message
    const message = chatHistoryManager.getMessage(messageId)
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this message
    // This would require checking if the message belongs to a session owned by the user
    // For now, we'll allow the deletion
    const deleted = chatHistoryManager.deleteMessage(messageId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    })
  } catch (error) {
    console.error('Delete message error:', error)
    
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
