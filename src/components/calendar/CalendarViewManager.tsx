'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, LayoutGrid } from 'lucide-react'
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { Task, CalendarView } from '@/types/tasks'

interface CalendarViewManagerProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  onTaskMove?: (taskId: string, newStartTime: Date, newEndTime: Date) => void
}

export function CalendarViewManager({ 
  tasks, 
  onTaskClick, 
  onTimeSlotClick, 
  onTaskMove 
}: CalendarViewManagerProps) {
  const [currentView, setCurrentView] = useState<CalendarView['type']>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDateRange = useCallback(() => {
    switch (currentView) {
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        }
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        }
      case 'day':
        return {
          start: currentDate,
          end: currentDate
        }
    }
  }, [currentView, currentDate])

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (currentView) {
        case 'month':
          return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
        case 'week':
          return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
        case 'day':
          return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1)
        default:
          return prev
      }
    })
  }, [currentView])

  const getDateTitle = useCallback(() => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
    }
  }, [currentView, currentDate])

  const handleViewChange = useCallback((newView: CalendarView['type']) => {
    setCurrentView(newView)
  }, [])

  const handleDateClick = useCallback((date: Date) => {
    if (currentView === 'month') {
      setCurrentDate(date)
      setCurrentView('week')
    } else if (currentView === 'week') {
      setCurrentDate(date)
      setCurrentView('day')
    }
  }, [currentView])

  const viewTransition = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.05, y: -20 },
    transition: { duration: 0.3 }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Navigation Header */}
      <div className="calendar-nav">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="px-3"
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h1 className="text-xl font-semibold text-foreground">
            {getDateTitle()}
          </h1>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            onClick={() => handleViewChange('month')}
            className={`view-toggle-button ${
              currentView === 'month' ? 'view-toggle-button-active' : 'view-toggle-button-inactive'
            }`}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Month
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={`view-toggle-button ${
              currentView === 'week' ? 'view-toggle-button-active' : 'view-toggle-button-inactive'
            }`}
          >
            <Grid3X3 className="h-4 w-4 mr-1.5" />
            Week
          </button>
          <button
            onClick={() => handleViewChange('day')}
            className={`view-toggle-button ${
              currentView === 'day' ? 'view-toggle-button-active' : 'view-toggle-button-inactive'
            }`}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Day
          </button>
        </div>
      </div>

      {/* Calendar Views with Smooth Transitions */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'month' && (
            <motion.div
              key="month"
              className="absolute inset-0"
              {...viewTransition}
            >
              <MonthView
                currentDate={currentDate}
                tasks={tasks}
                onDateClick={handleDateClick}
                onTaskClick={onTaskClick}
              />
            </motion.div>
          )}
          
          {currentView === 'week' && (
            <motion.div
              key="week"
              className="absolute inset-0"
              {...viewTransition}
            >
              <WeekView
                currentDate={currentDate}
                tasks={tasks}
                onDateClick={handleDateClick}
                onTaskClick={onTaskClick}
                onTimeSlotClick={onTimeSlotClick}
                onTaskMove={onTaskMove}
              />
            </motion.div>
          )}
          
          {currentView === 'day' && (
            <motion.div
              key="day"
              className="absolute inset-0"
              {...viewTransition}
            >
              <DayView
                currentDate={currentDate}
                tasks={tasks}
                onTaskClick={onTaskClick}
                onTimeSlotClick={onTimeSlotClick}
                onTaskMove={onTaskMove}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
