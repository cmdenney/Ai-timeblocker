'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  addWeeks,
  addMonths,
  isToday,
  isWeekend,
  getDay,
  setHours,
  setMinutes,
  differenceInMinutes
} from 'date-fns'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  MoreHorizontal,
  Clock,
  MapPin,
  Users,
  Settings,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'week' | 'day'

interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  color?: string
  isAllDay: boolean
  location?: string
  description?: string
  category?: 'work' | 'personal' | 'meeting' | 'break' | 'focus' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  attendees?: string[]
  recurrence?: {
    rule: string
    pattern: string
  }
}

interface CalendarProps {
  events: CalendarEvent[]
  onEventCreate: (event: Omit<CalendarEvent, 'id'>) => void
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void
  onEventDelete: (eventId: string) => void
  onDateSelect: (date: Date) => void
  selectedDate?: Date | null
  timezone?: string
  workingHours?: { start: number; end: number }
  showWeekends?: boolean
  enableDragDrop?: boolean
  enableKeyboardShortcuts?: boolean
}

const EVENT_CATEGORIES = {
  work: { label: 'Work', color: 'bg-blue-500', textColor: 'text-blue-500' },
  personal: { label: 'Personal', color: 'bg-green-500', textColor: 'text-green-500' },
  meeting: { label: 'Meeting', color: 'bg-purple-500', textColor: 'text-purple-500' },
  break: { label: 'Break', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  focus: { label: 'Focus', color: 'bg-orange-500', textColor: 'text-orange-500' },
  other: { label: 'Other', color: 'bg-gray-500', textColor: 'text-gray-500' }
}

const PRIORITY_COLORS = {
  low: 'border-l-green-500',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500'
}

export function Calendar({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateSelect,
  selectedDate,
  timezone = 'UTC',
  workingHours = { start: 9, end: 17 },
  showWeekends = true,
  enableDragDrop = true,
  enableKeyboardShortcuts = true
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null)
  const [quickCreateTime, setQuickCreateTime] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const calendarRef = useRef<HTMLDivElement>(null)

  // Generate calendar grid based on current view
  const calendarDays = useMemo(() => {
    switch (view) {
      case 'month':
        return generateMonthDays(currentDate)
      case 'week':
        return generateWeekDays(currentDate)
      case 'day':
        return [currentDate]
      default:
        return generateMonthDays(currentDate)
    }
  }, [currentDate, view])

  // Filter events for current view and search
  const visibleEvents = useMemo(() => {
    const startDate = calendarDays[0]
    const endDate = calendarDays[calendarDays.length - 1]

    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      const isInDateRange = eventDate >= startDate && eventDate <= endDate
      const matchesCategory = filterCategory === 'all' || event.category === filterCategory
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return isInDateRange && matchesCategory && matchesSearch
    })
  }, [events, calendarDays, filterCategory, searchQuery])

  // Handle drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !enableDragDrop) return

    const eventId = result.draggableId
    const newDate = parseISO(result.destination.droppableId)

    const event = events.find(e => e.id === eventId)
    if (event) {
      const timeDiff = event.endTime.getTime() - event.startTime.getTime()
      const newStartTime = new Date(newDate)
      newStartTime.setHours(event.startTime.getHours(), event.startTime.getMinutes())
      
      const newEndTime = new Date(newStartTime.getTime() + timeDiff)
      
      onEventUpdate(eventId, {
        startTime: newStartTime,
        endTime: newEndTime
      })
    }
  }, [events, onEventUpdate, enableDragDrop])

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (view) {
        case 'month':
          return direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1)
        case 'week':
          return direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1)
        case 'day':
          return direction === 'next' ? addDays(prev, 1) : addDays(prev, -1)
        default:
          return prev
      }
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Event handlers
  const handleEventCreate = (date: Date, time?: string) => {
    setQuickCreateDate(date)
    setQuickCreateTime(time || '')
    setIsEventModalOpen(true)
    setEditingEvent(null)
  }

  const handleEventEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsEventModalOpen(true)
  }

  const handleEventSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      onEventUpdate(editingEvent.id, eventData)
    } else {
      onEventCreate(eventData)
    }
    setIsEventModalOpen(false)
    setEditingEvent(null)
    setQuickCreateDate(null)
    setQuickCreateTime('')
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            navigateDate('prev')
            break
          case 'ArrowRight':
            e.preventDefault()
            navigateDate('next')
            break
          case 't':
            e.preventDefault()
            goToToday()
            break
          case 'm':
            e.preventDefault()
            setView('month')
            break
          case 'w':
            e.preventDefault()
            setView('week')
            break
          case 'd':
            e.preventDefault()
            setView('day')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, view])

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </h2>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          {/* Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Switcher */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as CalendarView[]).map((viewOption) => (
              <Button
                key={viewOption}
                variant={view === viewOption ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(viewOption)}
                className="capitalize h-8 px-3"
              >
                {viewOption}
              </Button>
            ))}
          </div>

          {/* Create Event Button */}
          <Button
            onClick={() => handleEventCreate(new Date())}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto" ref={calendarRef}>
        <DragDropContext onDragEnd={handleDragEnd}>
          {view === 'month' && (
            <MonthView 
              days={calendarDays}
              events={visibleEvents}
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              onEventCreate={handleEventCreate}
              onEventEdit={handleEventEdit}
              onEventDelete={onEventDelete}
              workingHours={workingHours}
              showWeekends={showWeekends}
            />
          )}
          
          {view === 'week' && (
            <WeekView 
              days={calendarDays}
              events={visibleEvents}
              onEventCreate={handleEventCreate}
              onEventEdit={handleEventEdit}
              onEventDelete={onEventDelete}
              workingHours={workingHours}
              showWeekends={showWeekends}
            />
          )}
          
          {view === 'day' && (
            <DayView 
              date={currentDate}
              events={visibleEvents.filter(e => isSameDay(e.startTime, currentDate))}
              onEventCreate={handleEventCreate}
              onEventEdit={handleEventEdit}
              onEventDelete={onEventDelete}
              workingHours={workingHours}
            />
          )}
        </DragDropContext>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false)
          setEditingEvent(null)
          setQuickCreateDate(null)
          setQuickCreateTime('')
        }}
        onSave={handleEventSave}
        event={editingEvent}
        defaultDate={quickCreateDate}
        defaultTime={quickCreateTime}
      />
    </div>
  )
}

// Month View Component
function MonthView({
  days,
  events,
  currentDate,
  selectedDate,
  onDateSelect,
  onEventCreate,
  onEventEdit,
  onEventDelete,
  workingHours,
  showWeekends
}: {
  days: Date[]
  events: CalendarEvent[]
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventCreate: (date: Date, time?: string) => void
  onEventEdit: (event: CalendarEvent) => void
  onEventDelete: (eventId: string) => void
  workingHours: { start: number; end: number }
  showWeekends: boolean
}) {
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="h-full">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center font-medium text-gray-500 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Weeks */}
      <div className="grid grid-rows-6 flex-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map(day => {
              const dayEvents = events.filter(event => 
                isSameDay(event.startTime, day)
              ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
              
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const isWeekendDay = !showWeekends && isWeekend(day)
              
              if (isWeekendDay) return null

              return (
                <Droppable key={day.toISOString()} droppableId={day.toISOString()}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "border-r last:border-r-0 p-2 min-h-[120px] cursor-pointer transition-colors",
                        "hover:bg-gray-50",
                        !isCurrentMonth && "text-gray-400 bg-gray-50",
                        isSelected && "bg-blue-50 border-blue-200",
                        isToday && "bg-blue-100 font-semibold"
                      )}
                      onClick={() => onDateSelect(day)}
                      onDoubleClick={() => onEventCreate(day)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={cn(
                          "font-medium text-sm",
                          isToday && "text-blue-600"
                        )}>
                          {format(day, 'd')}
                        </div>
                        {dayEvents.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, index) => (
                          <Draggable 
                            key={event.id} 
                            draggableId={event.id} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "text-xs px-2 py-1 rounded truncate cursor-move transition-all",
                                  "hover:opacity-80 hover:shadow-sm",
                                  EVENT_CATEGORIES[event.category || 'other'].color,
                                  "text-white",
                                  snapshot.isDragging && "opacity-50 shadow-lg"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEventEdit(event)
                                }}
                                title={`${event.title}\n${format(event.startTime, 'h:mm a')} - ${format(event.endTime, 'h:mm a')}`}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                {!event.isAllDay && (
                                  <div className="text-xs opacity-75">
                                    {format(event.startTime, 'h:mm a')}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                      
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ 
  days, 
  events, 
  onEventCreate, 
  onEventEdit, 
  onEventDelete,
  workingHours,
  showWeekends 
}: {
  days: Date[]
  events: CalendarEvent[]
  onEventCreate: (date: Date, time?: string) => void
  onEventEdit: (event: CalendarEvent) => void
  onEventDelete: (eventId: string) => void
  workingHours: { start: number; end: number }
  showWeekends: boolean
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const filteredDays = showWeekends ? days : days.filter(day => !isWeekend(day))

  return (
    <div className="flex flex-col h-full">
      {/* Week Header */}
      <div className="grid border-b bg-gray-50" style={{ gridTemplateColumns: `60px repeat(${filteredDays.length}, 1fr)` }}>
        <div className="p-3 border-r"></div>
        {filteredDays.map(day => (
          <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
            <div className="font-medium text-sm text-gray-500">{format(day, 'EEE')}</div>
            <div className={cn(
              "text-2xl font-bold",
              isToday(day) && "text-blue-600"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${filteredDays.length}, 1fr)` }}>
          {/* Time Labels */}
          <div className="border-r">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b p-2 text-xs text-gray-500">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {filteredDays.map(day => (
            <div key={day.toISOString()} className="border-r last:border-r-0 relative">
              {hours.map(hour => (
                <div
                  key={hour}
                  className={cn(
                    "h-16 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                    hour >= workingHours.start && hour < workingHours.end && "bg-blue-50/30"
                  )}
                  onClick={() => onEventCreate(day, `${hour}:00`)}
                />
              ))}
              
              {/* Events positioned absolutely */}
              {events
                .filter(event => isSameDay(event.startTime, day))
                .map(event => {
                  const startHour = event.startTime.getHours()
                  const startMinute = event.startTime.getMinutes()
                  const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60)
                  
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-1 right-1 p-1 text-xs rounded cursor-pointer transition-all",
                        "hover:opacity-80 hover:shadow-sm",
                        EVENT_CATEGORIES[event.category || 'other'].color,
                        "text-white",
                        PRIORITY_COLORS[event.priority || 'medium']
                      )}
                      style={{
                        top: `${(startHour + startMinute / 60) * 64}px`,
                        height: `${Math.max(duration * 64, 20)}px`,
                        minHeight: '20px'
                      }}
                      onClick={() => onEventEdit(event)}
                      title={`${event.title}\n${format(event.startTime, 'h:mm a')} - ${format(event.endTime, 'h:mm a')}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.location && (
                        <div className="truncate opacity-75">📍 {event.location}</div>
                      )}
                    </div>
                  )
                })
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({ 
  date, 
  events, 
  onEventCreate, 
  onEventEdit, 
  onEventDelete,
  workingHours 
}: {
  date: Date
  events: CalendarEvent[]
  onEventCreate: (date: Date, time?: string) => void
  onEventEdit: (event: CalendarEvent) => void
  onEventDelete: (eventId: string) => void
  workingHours: { start: number; end: number }
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex flex-col h-full">
      {/* Day Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h3>
      </div>

      {/* Hourly Schedule */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="flex border-b">
              <div className="w-20 p-3 text-sm text-gray-500 border-r bg-gray-50">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              <div 
                className={cn(
                  "flex-1 h-16 hover:bg-gray-50 cursor-pointer transition-colors",
                  hour >= workingHours.start && hour < workingHours.end && "bg-blue-50/30"
                )}
                onClick={() => onEventCreate(date, `${hour}:00`)}
              />
            </div>
          ))}
          
          {/* Events positioned absolutely */}
          {events.map(event => {
            const startHour = event.startTime.getHours()
            const startMinute = event.startTime.getMinutes()
            const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60)
            
            return (
              <Card
                key={event.id}
                className={cn(
                  "absolute left-24 right-4 p-3 cursor-pointer transition-all",
                  "hover:shadow-lg hover:scale-105",
                  EVENT_CATEGORIES[event.category || 'other'].color,
                  "text-white",
                  PRIORITY_COLORS[event.priority || 'medium']
                )}
                style={{
                  top: `${(startHour + startMinute / 60) * 64}px`,
                  height: `${Math.max(duration * 64, 40)}px`
                }}
                onClick={() => onEventEdit(event)}
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs opacity-75">
                  {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                </div>
                {event.location && (
                  <div className="text-xs opacity-75 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {event.location}
                  </div>
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="text-xs opacity-75 flex items-center mt-1">
                    <Users className="w-3 h-3 mr-1" />
                    {event.attendees.length} attendees
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Event Modal Component
function EventModal({
  isOpen,
  onClose,
  onSave,
  event,
  defaultDate,
  defaultTime
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (event: Omit<CalendarEvent, 'id'>) => void
  event?: CalendarEvent | null
  defaultDate?: Date | null
  defaultTime?: string
}) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    startTime: event?.startTime || (defaultDate ? setHours(defaultDate, defaultTime ? parseInt(defaultTime.split(':')[0]) : 9) : new Date()),
    endTime: event?.endTime || (defaultDate ? setHours(defaultDate, defaultTime ? parseInt(defaultTime.split(':')[0]) + 1 : 10) : new Date()),
    isAllDay: event?.isAllDay || false,
    location: event?.location || '',
    description: event?.description || '',
    category: event?.category || 'work',
    priority: event?.priority || 'medium',
    attendees: event?.attendees || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleTimeChange = (field: 'startTime' | 'endTime', time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const newTime = new Date(formData[field])
    newTime.setHours(hours, minutes)
    setFormData(prev => ({ ...prev, [field]: newTime }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center">
                        <div className={cn("w-3 h-3 rounded-full mr-2", category.color)} />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={format(formData.startTime, 'HH:mm')}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                disabled={formData.isAllDay}
              />
            </div>
            
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={format(formData.endTime, 'HH:mm')}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                disabled={formData.isAllDay}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isAllDay">All Day Event</Label>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Event location"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Event description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Utility functions
function generateMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date))
  const end = endOfWeek(endOfMonth(date))
  const days = []

  let current = start
  while (current <= end) {
    days.push(new Date(current))
    current = addDays(current, 1)
  }

  return days
}

function generateWeekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  const days = []

  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i))
  }

  return days
}
