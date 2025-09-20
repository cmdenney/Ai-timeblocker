# ChatGPT-Style Chat Interface Guide

This guide covers the complete ChatGPT-style chat interface for calendar interactions in AI Timeblocker.

## Overview

The chat interface provides:
- Real-time streaming chat with OpenAI
- Message threading and conversation history
- Typing indicators and loading states
- Quick action buttons for common requests
- Session and thread management
- Message persistence and search
- Calendar event integration

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Navigate to the chat interface:**
   ```
   http://localhost:3000/chat
   ```

## Core Components

### 1. ChatInterface

The main chat component with real-time streaming and session management.

```typescript
import { ChatInterface } from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return <ChatInterface />
}
```

### 2. MessageThread

Component for managing threaded conversations with replies and metadata.

```typescript
import { MessageThread } from '@/components/chat/MessageThread'

<MessageThread
  thread={thread}
  onReply={handleReply}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onToggleCollapse={handleToggleCollapse}
  onAddTag={handleAddTag}
  onRemoveTag={handleRemoveTag}
/>
```

### 3. Chat History Manager

Manages sessions, threads, and messages with persistence.

```typescript
import { chatHistoryManager } from '@/lib/chat-history'

// Create session
const session = chatHistoryManager.createSession(userId, 'My Chat')

// Add message to thread
const message = chatHistoryManager.createMessage('user', 'Hello!')
chatHistoryManager.addMessageToThread(threadId, message)
```

## API Endpoints

### Chat Sessions

#### Get Sessions
**GET** `/api/chat/sessions`

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-123",
        "title": "My Chat",
        "createdAt": "2024-01-16T10:00:00Z",
        "updatedAt": "2024-01-16T10:30:00Z",
        "lastMessageAt": "2024-01-16T10:30:00Z",
        "messageCount": 5,
        "userId": "user-123",
        "metadata": {
          "tags": ["work", "meetings"],
          "priority": "high"
        }
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### Create Session
**POST** `/api/chat/sessions`

```json
{
  "title": "New Chat",
  "metadata": {
    "tags": ["work"],
    "priority": "medium"
  }
}
```

#### Update Session
**PUT** `/api/chat/sessions`

```json
{
  "sessionId": "session-123",
  "updates": {
    "title": "Updated Chat Title",
    "metadata": {
      "priority": "high"
    }
  }
}
```

#### Delete Session
**DELETE** `/api/chat/sessions?sessionId=session-123`

### Chat Messages

#### Get Messages
**GET** `/api/chat/messages?sessionId=session-123`

Query parameters:
- `sessionId`: Filter by session
- `threadId`: Filter by thread
- `search`: Search messages
- `limit`: Number of messages to return
- `offset`: Pagination offset

#### Create Message
**POST** `/api/chat/messages`

```json
{
  "content": "Hello, AI!",
  "role": "user",
  "sessionId": "session-123",
  "threadId": "thread-456",
  "metadata": {
    "tokens": 10,
    "cost": 0.001
  }
}
```

#### Update Message
**PUT** `/api/chat/messages`

```json
{
  "messageId": "msg-123",
  "updates": {
    "content": "Updated message content"
  }
}
```

#### Delete Message
**DELETE** `/api/chat/messages?messageId=msg-123`

### Chat Threads

#### Get Threads
**GET** `/api/chat/threads?sessionId=session-123`

#### Create Thread
**POST** `/api/chat/threads`

```json
{
  "sessionId": "session-123",
  "parentId": "thread-456",
  "metadata": {
    "title": "New Thread",
    "tags": ["discussion"]
  }
}
```

#### Update Thread
**PUT** `/api/chat/threads`

```json
{
  "threadId": "thread-123",
  "updates": {
    "isCollapsed": true,
    "metadata": {
      "priority": "high"
    }
  }
}
```

#### Delete Thread
**DELETE** `/api/chat/threads?threadId=thread-123`

### AI Chat

#### Regular Chat
**POST** `/api/ai/chat`

```json
{
  "message": "Schedule a meeting for tomorrow at 2 PM",
  "timezone": "America/New_York",
  "template": "chat_conversation",
  "sessionId": "session-123",
  "threadId": "thread-456"
}
```

#### Streaming Chat
**POST** `/api/ai/stream-chat`

Same request format as regular chat, but returns Server-Sent Events stream.

## Features

### Real-time Streaming

The chat interface supports real-time streaming responses from OpenAI:

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/ai/stream-chat',
  onResponse: async (response) => {
    // Handle streaming response
    const data = await response.json()
    if (data.events) {
      await addEventsToCalendar(data.events)
    }
  }
})
```

### Message Threading

Messages can be organized into threads for better conversation management:

```typescript
// Create a new thread
const thread = chatHistoryManager.createThread(sessionId, parentId)

// Add message to thread
chatHistoryManager.addMessageToThread(threadId, message)
```

### Quick Actions

Pre-defined quick action buttons for common calendar requests:

```typescript
const quickActions = [
  {
    label: "Today's Schedule",
    action: () => handleQuickInput("Show my schedule for today")
  },
  {
    label: "Quick Meeting",
    action: () => handleQuickInput("Add a meeting tomorrow at 2 PM")
  },
  {
    label: "Clear Weekend",
    action: () => handleQuickInput("Clear my schedule for this weekend")
  }
]
```

### Typing Indicators

Visual feedback when AI is processing:

```typescript
{isTyping && (
  <div className="flex items-center space-x-2">
    <div className="typing-animation">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span>AI is thinking...</span>
  </div>
)}
```

### Message Metadata

Messages can include rich metadata for calendar events:

```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    parsedEvents?: ParsedEvent[]
    confidence?: number
    suggestions?: string[]
    conflicts?: Array<{
      type: string
      description: string
      severity: string
    }>
    tokens?: number
    cost?: number
  }
}
```

## Calendar Integration

### Parsed Events

The chat interface automatically parses calendar events from natural language:

```typescript
// Events are automatically extracted and displayed
{message.metadata?.parsedEvents && (
  <div className="bg-green-50 border border-green-200 rounded-md p-3">
    <div className="text-xs font-medium text-green-800 mb-2">
      📅 Parsed Events ({message.metadata.parsedEvents.length})
    </div>
    {message.metadata.parsedEvents.map((event, index) => (
      <div key={index} className="text-xs text-green-700">
        <div className="font-medium">{event.title}</div>
        <div>
          {format(new Date(event.startDate), 'MMM d, h:mm a')} - 
          {format(new Date(event.endDate), 'h:mm a')}
        </div>
        {event.location && (
          <div>📍 {event.location}</div>
        )}
        {event.confidence && (
          <Badge variant="secondary" className="text-xs mt-1">
            {Math.round(event.confidence * 100)}% confidence
          </Badge>
        )}
      </div>
    ))}
  </div>
)}
```

### Event Creation

Events can be automatically added to the calendar:

```typescript
const addEventsToCalendar = async (events: ParsedEvent[]) => {
  try {
    // Integrate with your calendar API
    await calendarService.addEvents(events)
  } catch (error) {
    console.error('Error adding events to calendar:', error)
  }
}
```

## Session Management

### Creating Sessions

```typescript
// Create new chat session
const session = chatHistoryManager.createSession(
  userId,
  'My Calendar Chat',
  {
    tags: ['work', 'meetings'],
    priority: 'high'
  }
)
```

### Session Statistics

```typescript
const stats = chatHistoryManager.getSessionStats(sessionId)
console.log({
  totalMessages: stats.totalMessages,
  totalTokens: stats.totalTokens,
  totalCost: stats.totalCost,
  eventsCreated: stats.eventsCreated,
  averageConfidence: stats.averageConfidence
})
```

### Session Search

```typescript
// Search messages across sessions
const results = chatHistoryManager.searchMessages('meeting tomorrow')

// Search within specific session
const sessionResults = chatHistoryManager.searchMessages('meeting', sessionId)
```

## Thread Management

### Creating Threads

```typescript
// Create new thread
const thread = chatHistoryManager.createThread(sessionId, parentId)

// Create thread with metadata
const thread = chatHistoryManager.createThread(sessionId, parentId, {
  title: 'Meeting Discussion',
  tags: ['work'],
  priority: 'high'
})
```

### Thread Operations

```typescript
// Add message to thread
chatHistoryManager.addMessageToThread(threadId, message)

// Update thread
chatHistoryManager.updateThread(threadId, {
  isCollapsed: true,
  metadata: { priority: 'low' }
})

// Delete thread
chatHistoryManager.deleteThread(threadId)
```

## Message Management

### Creating Messages

```typescript
// Create user message
const userMessage = chatHistoryManager.createMessage(
  'user',
  'Schedule a meeting for tomorrow at 2 PM'
)

// Create assistant message with metadata
const assistantMessage = chatHistoryManager.createMessage(
  'assistant',
  'I\'ve scheduled your meeting for tomorrow at 2:00 PM.',
  {
    parsedEvents: [event],
    confidence: 0.95,
    tokens: 150,
    cost: 0.002
  }
)
```

### Message Operations

```typescript
// Update message
chatHistoryManager.updateMessage(messageId, {
  content: 'Updated message content'
})

// Delete message
chatHistoryManager.deleteMessage(messageId)

// Get message
const message = chatHistoryManager.getMessage(messageId)
```

## Search and Filtering

### Search Messages

```typescript
// Search all messages
const results = chatHistoryManager.searchMessages('meeting')

// Search within session
const sessionResults = chatHistoryManager.searchMessages('meeting', sessionId)

// Search with date range
const dateResults = chatHistoryManager.getMessagesByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  sessionId
)
```

### Filter by Events

```typescript
// Get messages with parsed events
const eventMessages = chatHistoryManager.getMessagesWithEvents(sessionId)
```

## Data Export/Import

### Export Session

```typescript
const sessionData = chatHistoryManager.exportSession(sessionId)
// Returns: { session, threads, messages }
```

### Import Session

```typescript
const success = chatHistoryManager.importSession({
  session: exportedSession,
  threads: exportedThreads,
  messages: exportedMessages
})
```

## Styling and Theming

### CSS Classes

The chat interface uses Tailwind CSS classes for styling:

```css
/* Main chat container */
.chat-container {
  @apply flex h-screen bg-gray-50;
}

/* Message bubbles */
.message-user {
  @apply bg-blue-600 text-white;
}

.message-assistant {
  @apply bg-white border-gray-200;
}

/* Typing animation */
.typing-animation span {
  @apply h-2 w-2 bg-gray-400 rounded-full animate-pulse;
}
```

### Custom Styling

You can customize the appearance by modifying the component classes:

```typescript
<Card className={`p-4 ${isUser ? 'bg-blue-600 text-white' : 'bg-white'}`}>
  {/* Message content */}
</Card>
```

## Performance Optimization

### Message Pagination

```typescript
// Get messages with pagination
const messages = await fetch('/api/chat/messages', {
  method: 'GET',
  params: {
    sessionId: 'session-123',
    limit: 50,
    offset: 0
  }
})
```

### Lazy Loading

```typescript
// Load messages on demand
const [messages, setMessages] = useState([])
const [loading, setLoading] = useState(false)

const loadMoreMessages = async () => {
  setLoading(true)
  const response = await fetch(`/api/chat/messages?sessionId=${sessionId}&offset=${messages.length}`)
  const data = await response.json()
  setMessages(prev => [...prev, ...data.messages])
  setLoading(false)
}
```

### Memory Management

```typescript
// Cleanup old data
chatHistoryManager.cleanupOldData(30) // Keep 30 days of data
```

## Error Handling

### API Errors

```typescript
try {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Hello' })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
} catch (error) {
  console.error('Chat error:', error)
  // Handle error
}
```

### Streaming Errors

```typescript
const eventSource = new EventSource('/api/ai/stream-chat')

eventSource.onerror = (error) => {
  console.error('Streaming error:', error)
  eventSource.close()
}

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'error') {
    console.error('Stream error:', data.error)
  }
}
```

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { ChatInterface } from '@/components/chat/ChatInterface'

test('renders chat interface', () => {
  render(<ChatInterface />)
  expect(screen.getByText('AI Calendar Assistant')).toBeInTheDocument()
})
```

### Integration Tests

```typescript
test('sends message and receives response', async () => {
  const { result } = renderHook(() => useChat({
    api: '/api/ai/chat'
  }))
  
  act(() => {
    result.current.handleInputChange({
      target: { value: 'Hello' }
    })
  })
  
  act(() => {
    result.current.handleSubmit(new Event('submit'))
  })
  
  await waitFor(() => {
    expect(result.current.messages).toHaveLength(2)
  })
})
```

## Deployment

### Environment Variables

```env
# Required for chat functionality
OPENAI_API_KEY=your-openai-api-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Optional
CHAT_HISTORY_RETENTION_DAYS=30
CHAT_MAX_MESSAGES_PER_SESSION=1000
```

### Production Considerations

- Enable message persistence with database
- Implement rate limiting for API endpoints
- Set up monitoring for chat performance
- Configure proper error logging
- Implement user authentication and authorization

## Support

For issues and questions:
- Check the API documentation
- Review error logs and monitoring
- Test with minimal examples
- Verify OpenAI API configuration
