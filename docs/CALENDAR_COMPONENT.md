# Comprehensive Calendar Component Guide

This guide covers the complete calendar component system with month/week/day views, drag-and-drop functionality, and full event management capabilities.

## Overview

The Calendar component provides:
- **Multiple view modes** (month, week, day)
- **Drag-and-drop rescheduling** with visual feedback
- **Event creation and editing** with rich metadata
- **Color-coded categories** and priority levels
- **Keyboard shortcuts** for navigation
- **Responsive design** for all screen sizes
- **Accessibility features** for screen readers

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Use the calendar component:**
   ```typescript
   import { Calendar } from '@/components/calendar/Calendar'
   
   <Calendar
     events={events}
     onEventCreate={handleEventCreate}
     onEventUpdate={handleEventUpdate}
     onEventDelete={handleEventDelete}
     onDateSelect={handleDateSelect}
   />
   ```

## Core Components

### 1. Main Calendar Component

The primary calendar component with view switching and event management.

```typescript
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
```

### 2. Calendar Hook

Custom hook for managing calendar state and actions.

```typescript
import { useCalendar } from '@/hooks/useCalendar'

const {
  currentDate,
  selectedDate,
  view,
  events,
  visibleEvents,
  eventStats,
  navigateDate,
  goToToday,
  addEvent,
  updateEvent,
  deleteEvent
} = useCalendar({
  initialDate: new Date(),
  initialView: 'month',
  onEventChange: (event, action) => {
    console.log('Event changed:', event, action)
  }
})
```

### 3. Event Interface

Comprehensive event data structure.

```typescript
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
```

## View Modes

### Month View

Grid-based monthly calendar with event previews.

```typescript
<Calendar view="month" />
```

**Features:**
- 7-day week grid layout
- Event previews with truncation
- Drag-and-drop between dates
- Double-click to create events
- Weekend visibility toggle

### Week View

Detailed weekly view with hourly time slots.

```typescript
<Calendar view="week" />
```

**Features:**
- Hourly time grid (24 hours)
- Event positioning based on time
- Visual working hours highlighting
- Drag-and-drop time adjustment
- Click on time slot to create event

### Day View

Focused daily view with detailed event information.

```typescript
<Calendar view="day" />
```

**Features:**
- Single day focus
- Detailed event cards
- Hourly time slots
- Rich event metadata display
- Full event editing capabilities

## Event Management

### Creating Events

```typescript
const handleEventCreate = (event: Omit<CalendarEvent, 'id'>) => {
  // Create new event
  const newEvent = {
    ...event,
    id: `event-${Date.now()}`
  }
  
  // Add to calendar
  setEvents(prev => [...prev, newEvent])
}
```

### Updating Events

```typescript
const handleEventUpdate = (eventId: string, updates: Partial<CalendarEvent>) => {
  setEvents(prev => 
    prev.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    )
  )
}
```

### Deleting Events

```typescript
const handleEventDelete = (eventId: string) => {
  setEvents(prev => prev.filter(event => event.id !== eventId))
}
```

## Drag and Drop

### Enabling Drag and Drop

```typescript
<Calendar
  enableDragDrop={true}
  onEventUpdate={handleEventUpdate}
/>
```

### Drag and Drop Features

- **Date rescheduling**: Drag events between dates
- **Time adjustment**: Drag events to different time slots
- **Visual feedback**: Opacity changes during drag
- **Drop validation**: Prevents invalid drops
- **Auto-save**: Automatically saves changes

### Custom Drag Handlers

```typescript
const handleDragEnd = (result: DropResult) => {
  if (!result.destination) return
  
  const eventId = result.draggableId
  const newDate = parseISO(result.destination.droppableId)
  
  // Update event with new date/time
  updateEvent(eventId, {
    startTime: newDate,
    endTime: addHours(newDate, 1)
  })
}
```

## Event Categories and Colors

### Predefined Categories

```typescript
const EVENT_CATEGORIES = {
  work: { label: 'Work', color: 'bg-blue-500', textColor: 'text-blue-500' },
  personal: { label: 'Personal', color: 'bg-green-500', textColor: 'text-green-500' },
  meeting: { label: 'Meeting', color: 'bg-purple-500', textColor: 'text-purple-500' },
  break: { label: 'Break', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  focus: { label: 'Focus', color: 'bg-orange-500', textColor: 'text-orange-500' },
  other: { label: 'Other', color: 'bg-gray-500', textColor: 'text-gray-500' }
}
```

### Priority Colors

```typescript
const PRIORITY_COLORS = {
  low: 'border-l-green-500',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500'
}
```

### Custom Colors

```typescript
const event: CalendarEvent = {
  id: '1',
  title: 'Custom Event',
  startTime: new Date(),
  endTime: addHours(new Date(), 1),
  color: 'bg-pink-500', // Custom color
  category: 'personal'
}
```

## Keyboard Shortcuts

### Navigation Shortcuts

- **Ctrl/Cmd + Left Arrow**: Previous period
- **Ctrl/Cmd + Right Arrow**: Next period
- **Ctrl/Cmd + T**: Go to today
- **Ctrl/Cmd + M**: Switch to month view
- **Ctrl/Cmd + W**: Switch to week view
- **Ctrl/Cmd + D**: Switch to day view

### Enabling Shortcuts

```typescript
<Calendar
  enableKeyboardShortcuts={true}
  onViewChange={handleViewChange}
/>
```

## Timezone Support

### Setting Timezone

```typescript
<Calendar
  timezone="America/New_York"
  events={events}
/>
```

### Timezone Conversion

```typescript
import { formatInTimezone } from '@/lib/nlp/timezone-utils'

const eventTime = formatInTimezone(
  event.startTime,
  'America/New_York',
  'yyyy-MM-dd HH:mm'
)
```

## Working Hours

### Setting Working Hours

```typescript
<Calendar
  workingHours={{ start: 9, end: 17 }}
  events={events}
/>
```

### Visual Indicators

- **Working hours**: Light blue background
- **Non-working hours**: Default background
- **Weekend**: Optional visibility toggle

## Event Filtering and Search

### Category Filtering

```typescript
const [filterCategory, setFilterCategory] = useState('all')

const filteredEvents = filterEventsByCategory(events, filterCategory)
```

### Date Range Filtering

```typescript
const filteredEvents = filterEventsByDateRange(
  events,
  startDate,
  endDate
)
```

### Search Functionality

```typescript
const [searchQuery, setSearchQuery] = useState('')

const filteredEvents = searchEvents(events, searchQuery)
```

## Event Statistics

### Getting Statistics

```typescript
const { eventStats } = useCalendar()

console.log({
  today: eventStats.today,
  thisWeek: eventStats.thisWeek,
  thisMonth: eventStats.thisMonth,
  total: eventStats.total
})
```

## Conflict Detection

### Detecting Conflicts

```typescript
import { detectEventConflicts } from '@/hooks/useCalendar'

const conflicts = detectEventConflicts(events)

conflicts.forEach(conflict => {
  console.log(`${conflict.event1.title} conflicts with ${conflict.event2.title}`)
  console.log(`Type: ${conflict.type}, Severity: ${conflict.severity}`)
})
```

### Conflict Types

- **Overlap**: Events scheduled at the same time
- **Same Time**: Events at exactly the same time
- **Travel Time**: Insufficient time between locations

## Responsive Design

### Mobile Optimization

```typescript
<Calendar
  className="w-full h-screen"
  // Automatically adapts to screen size
/>
```

### Breakpoint Behavior

- **Desktop**: Full calendar with all features
- **Tablet**: Optimized layout with touch support
- **Mobile**: Stacked layout with simplified controls

## Accessibility Features

### Screen Reader Support

```typescript
<Calendar
  // Automatically includes ARIA labels
  // Keyboard navigation support
  // Focus management
/>
```

### Keyboard Navigation

- **Tab**: Navigate between elements
- **Arrow Keys**: Navigate dates
- **Enter**: Select date or event
- **Escape**: Close modals

## Customization

### Custom Styling

```typescript
<Calendar
  className="custom-calendar"
  // Custom CSS classes
/>
```

### Custom Event Renderer

```typescript
const CustomEventCard = ({ event }: { event: CalendarEvent }) => (
  <div className="custom-event-card">
    <h3>{event.title}</h3>
    <p>{event.location}</p>
  </div>
)
```

### Custom Date Renderer

```typescript
const CustomDateCell = ({ date }: { date: Date }) => (
  <div className="custom-date-cell">
    {format(date, 'd')}
  </div>
)
```

## Performance Optimization

### Event Virtualization

```typescript
<Calendar
  // Automatically virtualizes large event lists
  maxVisibleEvents={100}
/>
```

### Memoization

```typescript
const MemoizedCalendar = React.memo(Calendar)

// Prevents unnecessary re-renders
```

### Lazy Loading

```typescript
const LazyCalendar = lazy(() => import('@/components/calendar/Calendar'))

<Suspense fallback={<CalendarSkeleton />}>
  <LazyCalendar />
</Suspense>
```

## Integration Examples

### With Next.js

```typescript
// pages/calendar.tsx
import { Calendar } from '@/components/calendar/Calendar'

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4">
      <Calendar
        events={events}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
      />
    </div>
  )
}
```

### With State Management

```typescript
// Using Redux
const mapStateToProps = (state: RootState) => ({
  events: state.calendar.events,
  selectedDate: state.calendar.selectedDate
})

const mapDispatchToProps = {
  addEvent: calendarActions.addEvent,
  updateEvent: calendarActions.updateEvent,
  deleteEvent: calendarActions.deleteEvent
}

export default connect(mapStateToProps, mapDispatchToProps)(Calendar)
```

### With API Integration

```typescript
const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data.events)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return { events, loading, refetch: fetchEvents }
}
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Calendar } from '@/components/calendar/Calendar'

test('renders calendar with events', () => {
  const events = [
    {
      id: '1',
      title: 'Test Event',
      startTime: new Date(),
      endTime: new Date(),
      isAllDay: false
    }
  ]

  render(<Calendar events={events} />)
  
  expect(screen.getByText('Test Event')).toBeInTheDocument()
})
```

### Integration Tests

```typescript
test('creates event on double click', () => {
  const onEventCreate = jest.fn()
  
  render(<Calendar onEventCreate={onEventCreate} />)
  
  const dateCell = screen.getByText('15')
  fireEvent.doubleClick(dateCell)
  
  expect(onEventCreate).toHaveBeenCalled()
})
```

## Deployment

### Environment Variables

```env
# Calendar configuration
NEXT_PUBLIC_CALENDAR_TIMEZONE=America/New_York
NEXT_PUBLIC_CALENDAR_WORKING_HOURS_START=9
NEXT_PUBLIC_CALENDAR_WORKING_HOURS_END=17
```

### Production Considerations

- Enable event caching
- Implement rate limiting
- Set up monitoring
- Configure error logging
- Use CDN for assets

## Support

For issues and questions:
- Check the component documentation
- Review event data structure
- Verify timezone settings
- Test with minimal examples
- Check browser console for errors
