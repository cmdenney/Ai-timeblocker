import { NextRequest, NextResponse } from 'next/server'
import { getChatSessionWithMessages, addMessageToSession } from '@/lib/db-operations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    const session = await getChatSessionWithMessages(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { content, role, metadata } = body

    if (!content || !role) {
      return NextResponse.json(
        { error: 'Content and role are required' },
        { status: 400 }
      )
    }

    const message = await addMessageToSession(sessionId, {
      content,
      role,
      metadata,
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error adding message to session:', error)
    return NextResponse.json(
      { error: 'Failed to add message to session' },
      { status: 500 }
    )
  }
}
