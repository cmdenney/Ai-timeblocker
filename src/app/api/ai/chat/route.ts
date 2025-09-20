import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { retryableOpenAI } from '@/lib/openai-retry'
import { contextManager } from '@/lib/conversation-context'
import { tokenTracker } from '@/lib/token-tracking'
import { formatTemplate, getTemplate } from '@/lib/prompt-templates'
import { chatHistoryManager } from '@/lib/chat-history'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      message, 
      timezone = 'UTC',
      template = 'chat_conversation',
      sessionId,
      threadId
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get template
    const promptTemplate = getTemplate(template)
    if (!promptTemplate) {
      return NextResponse.json(
        { error: 'Invalid template' },
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

    // Format template with context
    const formattedTemplate = formatTemplate(promptTemplate, {
      timezone: context.timezone,
      currentDate: context.currentDate,
      workingHours: context.workingHours,
      existingEvents: context.recentEvents,
      preferences: context.userPreferences,
      recentEvents: context.recentEvents,
      userInput: message
    })

    // Get conversation history
    const conversationHistory = context.conversationHistory.slice(-10) // Last 10 messages
    const messages = [
      { role: 'system' as const, content: formattedTemplate.systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: formattedTemplate.userPrompt }
    ]

    // Generate response
    const response = await retryableOpenAI.chatCompletionsCreate({
      model: formattedTemplate.model,
      messages,
      temperature: formattedTemplate.temperature,
      max_tokens: formattedTemplate.maxTokens
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Track token usage
    const usage = response.usage
    if (usage) {
      tokenTracker.trackUsage(
        usage.prompt_tokens,
        usage.completion_tokens,
        formattedTemplate.model,
        `chat-${Date.now()}`
      )
    }

    // Create chat message
    const chatMessage = chatHistoryManager.createMessage(
      'assistant',
      content,
      {
        tokens: usage?.total_tokens || 0,
        cost: usage ? tokenTracker.estimateCost(
          usage.prompt_tokens,
          usage.completion_tokens,
          formattedTemplate.model
        ) : 0
      }
    )

    // Add to session if provided
    if (sessionId) {
      const session = chatHistoryManager.getSession(sessionId)
      if (session) {
        if (threadId) {
          chatHistoryManager.addMessageToThread(threadId, chatMessage)
        } else {
          // Create new thread for this message
          const thread = chatHistoryManager.createThread(sessionId)
          chatHistoryManager.addMessageToThread(thread.id, chatMessage)
        }
      }
    }

    // Add messages to conversation history
    contextManager.addMessage(
      context.id,
      'user',
      message,
      { type: 'chat_message', template }
    )

    contextManager.addMessage(
      context.id,
      'assistant',
      content,
      { 
        type: 'chat_response',
        template,
        tokens: usage?.total_tokens || 0,
        cost: usage ? tokenTracker.estimateCost(
          usage.prompt_tokens,
          usage.completion_tokens,
          formattedTemplate.model
        ) : 0
      }
    )

    // Update session data
    if (usage) {
      contextManager.updateSessionData(
        context.id,
        usage.total_tokens,
        tokenTracker.estimateCost(
          usage.prompt_tokens,
          usage.completion_tokens,
          formattedTemplate.model
        )
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: chatMessage,
        metadata: {
          template,
          tokens: usage?.total_tokens || 0,
          cost: usage ? tokenTracker.estimateCost(
            usage.prompt_tokens,
            usage.completion_tokens,
            formattedTemplate.model
          ) : 0
        }
      }
    })
  } catch (error) {
    console.error('Chat error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}