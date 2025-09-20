import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createStreamingChat } from '@/lib/openai-streaming'
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
    const conversationHistory = context.conversationHistory.slice(-10)
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: formattedTemplate.userPrompt }
    ]

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Add user message to history
          contextManager.addMessage(
            context.id,
            'user',
            message,
            { type: 'streaming_chat_message', template }
          )

          let fullResponse = ''
          let tokenCount = 0
          let messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          // Stream the response
          for await (const chunk of createStreamingChat(messages, {
            model: formattedTemplate.model,
            temperature: formattedTemplate.temperature,
            maxTokens: formattedTemplate.maxTokens,
            systemPrompt: formattedTemplate.systemPrompt
          })) {
            fullResponse = chunk.message.content
            tokenCount = chunk.message.metadata?.tokens || 0

            // Send chunk to client
            const data = JSON.stringify({
              type: 'chunk',
              id: messageId,
              content: chunk.message.content,
              isComplete: chunk.isComplete,
              metadata: chunk.message.metadata
            })
            
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))

            if (chunk.isComplete) {
              // Create final chat message
              const chatMessage = chatHistoryManager.createMessage(
                'assistant',
                fullResponse,
                {
                  tokens: tokenCount,
                  cost: tokenCount > 0 ? tokenTracker.estimateCost(
                    tokenCount * 0.7, // Estimate prompt tokens
                    tokenCount * 0.3, // Estimate completion tokens
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

              // Add assistant response to conversation history
              contextManager.addMessage(
                context.id,
                'assistant',
                fullResponse,
                { 
                  type: 'streaming_chat_response',
                  template,
                  tokens: tokenCount,
                  cost: tokenCount > 0 ? tokenTracker.estimateCost(
                    tokenCount * 0.7,
                    tokenCount * 0.3,
                    formattedTemplate.model
                  ) : 0
                }
              )

              // Update session data
              if (tokenCount > 0) {
                contextManager.updateSessionData(
                  context.id,
                  tokenCount,
                  tokenTracker.estimateCost(
                    tokenCount * 0.7,
                    tokenCount * 0.3,
                    formattedTemplate.model
                  )
                )
              }

              // Send completion signal
              const completionData = JSON.stringify({
                type: 'complete',
                message: chatMessage,
                metadata: {
                  template,
                  tokens: tokenCount,
                  cost: tokenCount > 0 ? tokenTracker.estimateCost(
                    tokenCount * 0.7,
                    tokenCount * 0.3,
                    formattedTemplate.model
                  ) : 0
                }
              })
              
              controller.enqueue(new TextEncoder().encode(`data: ${completionData}\n\n`))
              break
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Stream chat error:', error)
    
    return NextResponse.json(
      { error: 'Failed to start streaming chat' },
      { status: 500 }
    )
  }
}