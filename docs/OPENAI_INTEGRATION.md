# OpenAI Integration Guide

This guide covers the complete OpenAI integration for natural language processing of calendar events in AI Timeblocker.

## Overview

The OpenAI integration provides:
- Natural language parsing of calendar events
- Streaming chat interface
- Context-aware conversations
- Token usage tracking and cost optimization
- Retry logic and error handling
- Prompt templates for different scenarios

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```

3. **Configure OpenAI API key:**
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Test the integration:**
   ```bash
   npm run dev
   ```

## Core Components

### 1. OpenAI Client Configuration

```typescript
// src/lib/openai.ts
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
})
```

### 2. Calendar Event Parsing

```typescript
import { parseCalendarEvents } from '@/lib/openai'

const result = await parseCalendarEvents(
  "Schedule a meeting with John tomorrow at 2pm",
  "America/New_York",
  {
    currentDate: new Date(),
    workingHours: { start: "09:00", end: "17:00" },
    existingEvents: [],
    preferences: {}
  }
)
```

### 3. Streaming Chat

```typescript
import { createStreamingChat } from '@/lib/openai-streaming'

const stream = createStreamingChat([
  { role: 'user', content: 'Help me schedule my day' }
])

for await (const chunk of stream) {
  console.log(chunk.message.content)
}
```

## API Endpoints

### Parse Calendar Events

**POST** `/api/ai/parse-events`

Parse natural language into structured calendar events.

```json
{
  "userInput": "Schedule a meeting with John tomorrow at 2pm",
  "timezone": "America/New_York"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "title": "Meeting with John",
        "startDate": "2024-01-16T14:00:00.000Z",
        "endDate": "2024-01-16T15:00:00.000Z",
        "isAllDay": false,
        "confidence": 0.95,
        "category": "meeting",
        "priority": "medium"
      }
    ],
    "message": "I've scheduled a meeting with John for tomorrow at 2:00 PM.",
    "suggestions": ["Consider adding a 15-minute buffer before the meeting"],
    "conflicts": []
  }
}
```

### Chat Interface

**POST** `/api/ai/chat`

General chat conversation about calendar and productivity.

```json
{
  "message": "How can I optimize my schedule?",
  "timezone": "America/New_York",
  "template": "chat_conversation"
}
```

### Streaming Chat

**POST** `/api/ai/stream-chat`

Streaming chat interface for real-time responses.

```json
{
  "message": "Help me plan my week",
  "timezone": "America/New_York",
  "template": "time_blocking"
}
```

## Prompt Templates

### Calendar Parsing Template

```typescript
import { CALENDAR_PARSING_TEMPLATE } from '@/lib/prompt-templates'

// Automatically used for event parsing
const result = await parseCalendarEvents(userInput, timezone)
```

### Time Blocking Template

```typescript
import { TIME_BLOCKING_TEMPLATE } from '@/lib/prompt-templates'

// Used for creating focused time blocks
const result = await chatWithTemplate(userInput, 'time_blocking')
```

### Meeting Scheduling Template

```typescript
import { MEETING_SCHEDULING_TEMPLATE } from '@/lib/prompt-templates'

// Used for scheduling meetings
const result = await chatWithTemplate(userInput, 'meeting_scheduling')
```

## Context Management

### Conversation Context

```typescript
import { contextManager } from '@/lib/conversation-context'

// Get user context
const context = await contextManager.getContext(
  userId,
  timezone,
  userPreferences,
  recentEvents
)

// Add message to history
contextManager.addMessage(
  context.id,
  'user',
  message,
  { type: 'calendar_request' }
)
```

### Context Features

- **User Preferences**: Timezone, working hours, AI settings
- **Recent Events**: Last 10 calendar events for context
- **Conversation History**: Last 50 messages for continuity
- **Session Data**: Token usage and cost tracking

## Token Tracking and Cost Optimization

### Usage Tracking

```typescript
import { tokenTracker } from '@/lib/token-tracking'

// Track token usage
tokenTracker.trackUsage(
  promptTokens,
  completionTokens,
  model,
  requestId
)

// Get usage statistics
const stats = tokenTracker.getUsageStats('day')
console.log(`Daily usage: ${stats.totalTokens} tokens, $${stats.totalCost}`)
```

### Cost Optimization

```typescript
// Get model recommendations
const recommendation = tokenTracker.getModelRecommendation('calendar')
console.log(`Recommended model: ${recommendation.model}`)

// Get optimization suggestions
const suggestions = tokenTracker.getOptimizationSuggestions()
```

### Usage Limits

```typescript
// Check usage limits
const limits = tokenTracker.checkLimits(userId)
if (limits.dailyExceeded) {
  console.log('Daily token limit exceeded')
}

// Set custom limits
tokenTracker.setLimits(userId, 100000, 2000000) // 100K daily, 2M monthly
```

## Error Handling and Retry Logic

### Retry Configuration

```typescript
import { withRetry } from '@/lib/openai-retry'

const result = await withRetry(
  () => openai.chat.completions.create(params),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
)
```

### Circuit Breaker

```typescript
import { circuitBreaker } from '@/lib/openai-retry'

const result = await circuitBreaker.execute(
  () => openai.chat.completions.create(params)
)
```

### Error Types

```typescript
import { OpenAIError } from '@/lib/openai-retry'

try {
  await parseCalendarEvents(userInput)
} catch (error) {
  if (error instanceof OpenAIError) {
    console.log(`Error: ${error.message}, Code: ${error.code}`)
    console.log(`Retryable: ${error.retryable}`)
  }
}
```

## Streaming Implementation

### Server-Sent Events

```typescript
// Client-side streaming
const eventSource = new EventSource('/api/ai/stream-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Help me schedule my day' })
})

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'chunk') {
    console.log(data.content)
  } else if (data.type === 'complete') {
    console.log('Stream complete:', data.message)
  }
}
```

### React Hook for Streaming

```typescript
import { useState, useEffect } from 'react'

function useStreamingChat() {
  const [message, setMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = async (userInput: string) => {
    setIsStreaming(true)
    setMessage('')

    const response = await fetch('/api/ai/stream-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput })
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'chunk') {
            setMessage(data.content)
          } else if (data.type === 'complete') {
            setIsStreaming(false)
          }
        }
      }
    }
  }

  return { message, isStreaming, sendMessage }
}
```

## Model Selection and Optimization

### Model Recommendations

```typescript
import { tokenTracker } from '@/lib/token-tracking'

// Get model recommendation based on task type
const recommendation = tokenTracker.getModelRecommendation('calendar')
// Returns: { model: 'gpt-4-turbo', maxTokens: 1000, temperature: 0.3, reasoning: '...' }
```

### Cost-Aware Model Selection

```typescript
// Check usage and select appropriate model
const stats = tokenTracker.getUsageStats('day')
const isHighUsage = stats.totalTokens > 50000

const model = isHighUsage ? 'gpt-3.5-turbo' : 'gpt-4-turbo'
```

## Security and Rate Limiting

### API Key Security

- Store API key in environment variables
- Use server-side only for API calls
- Implement rate limiting per user
- Monitor usage and costs

### Rate Limiting

```typescript
// Check limits before making requests
const limits = tokenTracker.checkLimits(userId)
if (limits.dailyExceeded) {
  throw new Error('Daily token limit exceeded')
}
```

## Monitoring and Analytics

### Usage Statistics

```typescript
// Get comprehensive usage stats
const stats = tokenTracker.getUsageStats('month')
console.log({
  totalTokens: stats.totalTokens,
  totalCost: stats.totalCost,
  requestsCount: stats.requestsCount,
  averageTokensPerRequest: stats.averageTokensPerRequest,
  modelBreakdown: stats.modelBreakdown
})
```

### Context Statistics

```typescript
// Get context manager stats
const contextStats = contextManager.getContextStats()
console.log({
  totalContexts: contextStats.totalContexts,
  totalTokens: contextStats.totalTokens,
  totalCost: contextStats.totalCost,
  totalRequests: contextStats.totalRequests
})
```

## Testing

### Unit Tests

```typescript
import { parseCalendarEvents } from '@/lib/openai'

test('parses calendar events correctly', async () => {
  const result = await parseCalendarEvents(
    'Schedule a meeting tomorrow at 2pm',
    'UTC'
  )
  
  expect(result.events).toHaveLength(1)
  expect(result.events[0].title).toBe('Meeting')
  expect(result.events[0].confidence).toBeGreaterThan(0.8)
})
```

### Integration Tests

```typescript
test('handles API errors gracefully', async () => {
  // Mock OpenAI API error
  jest.spyOn(openai.chat.completions, 'create').mockRejectedValue(
    new Error('API rate limit exceeded')
  )

  await expect(parseCalendarEvents('test input')).rejects.toThrow()
})
```

## Production Considerations

### Environment Variables

```env
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT=30000
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Monitoring

- Set up alerts for high token usage
- Monitor API response times
- Track error rates and retry patterns
- Monitor costs and usage patterns

### Scaling

- Implement connection pooling
- Use circuit breakers for reliability
- Cache frequent responses
- Implement request queuing for high load

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify API key is correct
   - Check API key permissions
   - Ensure key is not expired

2. **Rate Limiting**
   - Implement exponential backoff
   - Use circuit breakers
   - Monitor usage patterns

3. **Token Limits**
   - Reduce max_tokens parameter
   - Use more efficient prompts
   - Implement response truncation

4. **Context Issues**
   - Clear old conversation history
   - Reduce context window size
   - Use conversation summarization

### Debug Mode

```typescript
// Enable debug logging
process.env.OPENAI_DEBUG = 'true'

// Check API health
const health = await checkOpenAIHealthWithRetry()
console.log('OpenAI Health:', health)
```

## Support

For issues and questions:
- Check OpenAI API documentation
- Review error logs and monitoring
- Test with minimal examples
- Verify API key and permissions
