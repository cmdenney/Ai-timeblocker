import { NextRequest, NextResponse } from 'next/server'
import { webhookManager, validateWebhookRequest } from '@/lib/google-calendar-webhook'

export async function POST(request: NextRequest) {
  try {
    // Validate webhook request
    if (!validateWebhookRequest(request)) {
      return NextResponse.json(
        { error: 'Invalid webhook request' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Extract webhook headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Create webhook notification
    const notification = {
      id: headers['x-goog-channel-id'] || `webhook-${Date.now()}`,
      resourceId: headers['x-goog-resource-id'] || '',
      resourceUri: headers['x-goog-resource-uri'] || '',
      token: headers['x-goog-channel-token'] || '',
      expiration: headers['x-goog-resource-expiration'] || '',
      type: 'push' as const,
      headers,
      body,
      timestamp: new Date()
    }

    // Process webhook notification
    await webhookManager.processWebhookNotification(request, notification)

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return webhook status and statistics
    const stats = webhookManager.getWebhookStats()
    const webhooks = webhookManager.getRegisteredWebhooks()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        webhooks: webhooks.map(webhook => ({
          id: webhook.id,
          resourceId: webhook.resourceId,
          type: webhook.type,
          expiration: webhook.expiration,
          timestamp: webhook.timestamp
        }))
      }
    })
  } catch (error) {
    console.error('Get webhook stats error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get webhook statistics' },
      { status: 500 }
    )
  }
}
