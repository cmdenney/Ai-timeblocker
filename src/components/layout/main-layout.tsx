'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Calendar, 
  Menu, 
  X, 
  Settings, 
  User, 
  BarChart3, 
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { AuthService } from '@/lib/supabase/auth'
import { useEffect } from 'react'

interface MainLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function MainLayout({ children, user }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleChat = () => {
    setChatOpen(!chatOpen)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-gray-200 bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <h1 className="text-xl font-semibold">AI TimeBlocker</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleChat}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            AI Assistant
          </Button>
          {user && <SignOutButton user={user} />}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-gray-200 bg-background overflow-hidden`}>
          <div className="h-full p-4 space-y-4">
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => window.location.href = '/calendar'}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => window.location.href = '/dashboard'}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => window.location.href = '/profile'}
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          
          {/* AI Chatbox */}
          {chatOpen && (
            <div className="h-96 border-t border-gray-200 bg-background">
              <AIChatbox />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// AI Chatbox Component
interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function AIChatbox() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I&apos;m your AI timeblocking assistant. Tell me what you need to schedule and I&apos;ll help you create time blocks automatically.",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // TODO: Implement AI parsing and timeblocking logic
      const response = await fetch('/api/ai/parse-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()
      
      let responseMessage = data.message || "I&apos;ve processed your request and created the time blocks. Check your calendar!"
      
      // If events were created, add them to the calendar
      if (data.events && data.events.length > 0) {
        try {
          // TODO: Save events to calendar
          responseMessage += `\n\nI&apos;ve created ${data.events.length} time block(s) for you. Check your calendar to see them!`
        } catch (error) {
          console.error('Error saving events:', error)
          responseMessage += "\n\nNote: I parsed your request but couldn&apos;t save the events to your calendar. Please try again."
        }
      }
      
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseMessage,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold">AI Timeblocking Assistant</h3>
        <p className="text-sm text-muted-foreground">Describe your schedule and I&apos;ll create time blocks automatically</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
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
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe what you need to schedule..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            size="sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
