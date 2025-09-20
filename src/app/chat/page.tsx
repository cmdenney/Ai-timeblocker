'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Calendar, Clock } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI timeblocking assistant. I can help you schedule events, manage your calendar, and optimize your time. What would you like to do today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you want to "${input}". Let me help you schedule that. This is a demo response - in the full version, I would parse your request and create calendar events automatically.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">AI Chat</h1>
            <p className="text-muted-foreground">
              Chat with your AI timeblocking assistant
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (e.g., 'Schedule a meeting tomorrow at 2pm')"
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Schedule Event</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                &ldquo;Schedule a meeting with John tomorrow at 2pm&rdquo;
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Time Block</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                &ldquo;Block 2 hours for deep work this afternoon&rdquo;
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Ask Questions</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                &ldquo;What&apos;s my schedule like this week?&rdquo;
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}