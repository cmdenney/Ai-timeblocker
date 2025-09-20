'use client'

import { useState } from 'react'
import { CalendarView } from '@/components/calendar/calendar-view'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/components/ui/use-toast'
import { calendarEventVariants, timeBlockVariants, notificationVariants } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import type { CalendarEvent, ChatMessage } from '@/types'

// Sample data
const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team standup',
    startTime: new Date(2024, 0, 15, 10, 0),
    endTime: new Date(2024, 0, 15, 11, 0),
    isAllDay: false,
    category: 'meeting',
    priority: 'high',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'demo-user',
  },
  {
    id: '2',
    title: 'Focus Work',
    description: 'Deep work session',
    startTime: new Date(2024, 0, 15, 14, 0),
    endTime: new Date(2024, 0, 15, 16, 0),
    isAllDay: false,
    category: 'focus',
    priority: 'medium',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'demo-user',
  },
  {
    id: '3',
    title: 'Lunch Break',
    description: 'Personal time',
    startTime: new Date(2024, 0, 15, 12, 0),
    endTime: new Date(2024, 0, 15, 13, 0),
    isAllDay: false,
    category: 'break',
    priority: 'low',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'demo-user',
  },
]

const sampleChatMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your AI TimeBlocker assistant. I can help you optimize your schedule, create time blocks, and provide insights about your productivity patterns.',
    createdAt: new Date(Date.now() - 60000),
  },
  {
    id: '2',
    role: 'user',
    content: 'Can you help me schedule a focus session for tomorrow?',
    createdAt: new Date(Date.now() - 30000),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Absolutely! I can see you have a free slot tomorrow from 2:00 PM to 4:00 PM. Would you like me to create a 2-hour focus session during that time?',
    createdAt: new Date(Date.now() - 15000),
  },
]

export default function DemoPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(sampleChatMessages)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    toast({
      title: 'Date Selected',
      description: `You selected ${date.toLocaleDateString()}`,
    })
  }

  const handleEventClick = (event: CalendarEvent) => {
    toast({
      title: 'Event Clicked',
      description: `${event.title} - ${event.description}`,
    })
  }

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      createdAt: new Date(),
    }
    
    setChatMessages(prev => [...prev, newMessage])
    setIsLoading(true)
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${message}". This is a demo response from the AI assistant.`,
        createdAt: new Date(),
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AI TimeBlocker Demo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the power of AI-driven time management with our comprehensive demo.
        </p>
      </div>

      {/* Calendar and Chat Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Calendar Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Calendar View</h2>
            <CalendarView
              events={sampleEvents}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Event Categories Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Event Categories</CardTitle>
              <CardDescription>Different types of calendar events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {['work', 'personal', 'meeting', 'break', 'focus', 'other'].map((category) => (
                <div
                  key={category}
                  className={cn(
                    calendarEventVariants({
                      category: category as any,
                      priority: 'medium',
                      size: 'md'
                    })
                  )}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)} Event
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">AI Chat Assistant</h2>
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>

          {/* Time Block Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Time Block Examples</CardTitle>
              <CardDescription>Different priority levels and categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn(timeBlockVariants({ category: 'work', priority: 'urgent', size: 'md' }))}>
                Urgent Work Task
              </div>
              <div className={cn(timeBlockVariants({ category: 'focus', priority: 'high', size: 'md' }))}>
                High Priority Focus Session
              </div>
              <div className={cn(timeBlockVariants({ category: 'meeting', priority: 'medium', size: 'md' }))}>
                Medium Priority Meeting
              </div>
              <div className={cn(timeBlockVariants({ category: 'break', priority: 'low', size: 'md' }))}>
                Low Priority Break
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Component Showcase */}
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold">Component Showcase</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Various button styles and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button>Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="demo-input">Demo Input</Label>
                <Input id="demo-input" placeholder="Enter text here..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-email">Email</Label>
                <Input id="demo-email" type="email" placeholder="your@email.com" />
              </div>
            </CardContent>
          </Card>

          {/* Avatars */}
          <Card>
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
              <CardDescription>User profile images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Avatar>
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Different notification types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn(notificationVariants({ type: 'info', size: 'sm' }))}>
                Information notification
              </div>
              <div className={cn(notificationVariants({ type: 'success', size: 'sm' }))}>
                Success notification
              </div>
              <div className={cn(notificationVariants({ type: 'warning', size: 'sm' }))}>
                Warning notification
              </div>
              <div className={cn(notificationVariants({ type: 'error', size: 'sm' }))}>
                Error notification
              </div>
            </CardContent>
          </Card>

          {/* Dialog Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
              <CardDescription>Modal dialogs and popovers</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Demo Dialog</DialogTitle>
                    <DialogDescription>
                      This is a demo dialog component. You can use it for forms, confirmations, and more.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Dialog content goes here. You can add any components inside.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Dropdown Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
              <CardDescription>Context menus and dropdowns</CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Help</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calendar Component Demo */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Calendar Component</h2>
        <Card className="w-fit mx-auto">
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
