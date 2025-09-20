'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { ParsedEvent } from '@/lib/openai'
import { Search } from '@/components/ui/search'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  metadata?: {
    parsedEvents?: ParsedEvent[]
    confidence?: number
    suggestions?: string[]
    conflicts?: Array<{
      type: string
      description: string
      severity: string
    }>
  }
}

interface ChatSession {
  id: string
  title: string
  createdAt: Date
  lastMessageAt: Date
  messageCount: number
}

export function ChatInterface() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    setMessages,
    reload,
    stop
  } = useChat({
    api: '/api/ai/stream-chat',
    onResponse: async (response) => {
      setIsTyping(true)
      try {
        const data = await response.json()
        if (data.events) {
          // Handle parsed events from AI response
          await addEventsToCalendar(data.events)
        }
      } catch (error) {
        console.error('Error processing response:', error)
      } finally {
        setIsTyping(false)
      }
    },
    onFinish: (message) => {
      setIsTyping(false)
      // Update session with new message
      updateSession(message)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleQuickInput = (text: string) => {
    const syntheticEvent = {
      target: { value: text }
    } as React.ChangeEvent<HTMLInputElement>
    handleInputChange(syntheticEvent)
  }

  const addEventsToCalendar = async (events: ParsedEvent[]) => {
    try {
      // This would integrate with your calendar API
      console.log('Adding events to calendar:', events)
      // await calendarService.addEvents(events)
    } catch (error) {
      console.error('Error adding events to calendar:', error)
    }
  }

  const updateSession = (message: any) => {
    if (selectedSession) {
      setSessions(prev => prev.map(session => 
        session.id === selectedSession 
          ? { 
              ...session, 
              lastMessageAt: new Date(),
              messageCount: session.messageCount + 1
            }
          : session
      ))
    }
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0
    }
    setSessions(prev => [newSession, ...prev])
    setSelectedSession(newSession.id)
    setMessages([])
  }

  const clearMessages = () => {
    setMessages([])
  }

  const quickActions = [
    {
      label: "Today's Schedule",
      icon: Calendar,
      action: () => handleQuickInput("Show my schedule for today")
    },
    {
      label: "Quick Meeting",
      icon: Clock,
      action: () => handleQuickInput("Add a meeting tomorrow at 2 PM")
    },
    {
      label: "Clear Weekend",
      icon: Trash2,
      action: () => handleQuickInput("Clear my schedule for this weekend")
    },
    {
      label: "Find Free Time",
      icon: Search,
      action: () => handleQuickInput("When do I have free time this week?")
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">AI Calendar</h2>
            <Button
              onClick={createNewSession}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedSession === session.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSession(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(session.lastMessageAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      {session.messageCount}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle session options
                      }}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Calendar Assistant</h2>
              <p className="text-sm text-gray-600">
                Tell me about your schedule and I&apos;ll help you organize it
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reload()}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to AI Calendar Assistant
                </h3>
                <p className="text-gray-600 mb-6">
                  I can help you manage your calendar, schedule meetings, and organize your time.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="justify-start"
                    >
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              // Convert useChat Message to our ChatMessage type
              const chatMessage: ChatMessage = {
                id: message.id,
                role: message.role === 'user' || message.role === 'assistant' ? message.role : 'assistant',
                content: message.content,
                createdAt: new Date(message.createdAt || Date.now()),
                metadata: undefined
              }
              
              return (
                <ChatMessage
                  key={message.id}
                  message={chatMessage}
                  isLoading={isLoading && message === messages[messages.length - 1]}
                />
              )
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </Avatar>
                <Card className="p-3">
                  <div className="flex items-center space-x-1">
                    <div className="typing-animation">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Tell me about your schedule... (e.g., 'I have work at 2:30 on Tuesday, Wednesday, Thursday')"
                  className="pr-12"
                  disabled={isLoading}
                />
                {isLoading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={stop}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  </Button>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <action.icon className="w-3 h-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Individual message component
function ChatMessage({ message, isLoading }: { message: ChatMessage; isLoading?: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          {isUser ? (
            <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">U</span>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </Avatar>

        <Card className={`p-4 ${isUser ? 'bg-blue-600 text-white' : 'bg-white border-gray-200'}`}>
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          
          {/* Show parsed events if available */}
          {message.metadata?.parsedEvents && message.metadata.parsedEvents.length > 0 && (
            <div className="mt-3 space-y-2">
              <Separator className={isUser ? 'bg-blue-500' : 'bg-gray-200'} />
              <div className="text-xs font-medium opacity-80 mb-2">
                📅 Parsed Events ({message.metadata.parsedEvents.length})
              </div>
              {message.metadata.parsedEvents.map((event, index) => (
                <div 
                  key={index} 
                  className={`text-xs p-2 rounded ${
                    isUser 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-50 text-green-800 border border-green-200'
                  }`}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(event.startDate), 'MMM d, h:mm a')} - 
                      {format(new Date(event.endDate), 'h:mm a')}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.confidence && (
                    <div className="mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          event.confidence > 0.8 
                            ? 'bg-green-100 text-green-800' 
                            : event.confidence > 0.6 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {Math.round(event.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Show suggestions if available */}
          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              <Separator className={isUser ? 'bg-blue-500' : 'bg-gray-200'} />
              <div className="text-xs font-medium opacity-80 mb-2">
                💡 Suggestions
              </div>
              {message.metadata.suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`text-xs p-2 rounded ${
                    isUser 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Show conflicts if available */}
          {message.metadata?.conflicts && message.metadata.conflicts.length > 0 && (
            <div className="mt-3 space-y-2">
              <Separator className={isUser ? 'bg-blue-500' : 'bg-gray-200'} />
              <div className="text-xs font-medium opacity-80 mb-2">
                ⚠️ Conflicts Detected
              </div>
              {message.metadata.conflicts.map((conflict, index) => (
                <div 
                  key={index}
                  className={`text-xs p-2 rounded ${
                    isUser 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <div className="font-medium capitalize">{conflict.type.replace('_', ' ')}</div>
                  <div className="mt-1">{conflict.description}</div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs mt-1 ${
                      conflict.severity === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : conflict.severity === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {conflict.severity} severity
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className={`text-xs opacity-70 mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {format(message.createdAt, 'h:mm a')}
          </div>
        </Card>
      </div>
    </div>
  )
}

// Typing animation styles
const typingAnimation = `
  .typing-animation {
    display: flex;
    align-items: center;
    space-x: 1px;
  }
  
  .typing-animation span {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: #6b7280;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-animation span:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  .typing-animation span:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = typingAnimation
  document.head.appendChild(style)
}
