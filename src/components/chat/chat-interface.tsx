'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { chatMessageVariants, loadingVariants } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface ChatInterfaceProps {
  messages?: ChatMessage[]
  onSendMessage?: (message: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInterface({ 
  messages = [], 
  onSendMessage, 
  isLoading = false,
  placeholder = "Ask me about your schedule..."
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageIcon = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'assistant':
        return <Bot className="h-4 w-4" />
      case 'system':
        return <div className="h-4 w-4 rounded-full bg-muted-foreground" />
      default:
        return null
    }
  }

  const getMessageInitials = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return 'U'
      case 'assistant':
        return 'AI'
      case 'system':
        return 'S'
      default:
        return '?'
    }
  }

  return (
    <Card className="flex flex-col h-96">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages container */}
        <div className="chat-container flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">AI TimeBlocker Assistant</p>
                <p className="text-sm">How can I help you with your schedule today?</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'chat-message',
                  message.role === 'user' && 'chat-message-user'
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="" alt={message.role} />
                  <AvatarFallback className="text-xs">
                    {getMessageInitials(message.role)}
                  </AvatarFallback>
                </Avatar>
                
                <div
                  className={cn(
                    chatMessageVariants({
                      type: message.role,
                      size: 'md'
                    })
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getMessageIcon(message.role)}
                    <span className="text-xs text-muted-foreground">
                      {message.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="chat-message">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">AI</AvatarFallback>
              </Avatar>
              <div className={cn(chatMessageVariants({ type: 'assistant', size: 'md' }))}>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <div className={cn(loadingVariants({ type: 'dots' }))}>
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
