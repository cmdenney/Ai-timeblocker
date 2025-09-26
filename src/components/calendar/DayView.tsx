'use client'

import { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, isSameDay, isToday } from 'date-fns'
import { Task, TIME_SLOT_CONFIG } from '@/types/tasks'
import { TaskBlock } from '../tasks/TaskBlock'

interface DayViewProps {
  currentDate: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  onTaskMove?: (taskId: string, newStartTime: Date, newEndTime: Date) => void
}

export function DayView({ 
  currentDate, 
  tasks, 
  onTaskClick, 
  onTimeSlotClick, 
  onTaskMove 
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { dayTasks, timeSlots } = useMemo(() => {
    const dayTasks = tasks
      .filter(task => isSameDay(task.startTime, currentDate))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const slots = []
    for (let hour = TIME_SLOT_CONFIG.startHour; hour <= TIME_SLOT_CONFIG.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_CONFIG.slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time,
          hour,
          minute,
          isHour: minute === 0,
          isHalfHour: minute === 30,
          isQuarterHour: minute === 15 || minute === 45
        })
      }
    }

    return { dayTasks, timeSlots: slots }
  }, [currentDate, tasks])

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (isToday(currentDate) && scrollRef.current) {
      const currentHour = new Date().getHours()
      const currentMinute = new Date().getMinutes()
      const currentSlot = ((currentHour - TIME_SLOT_CONFIG.startHour) * 4) + (currentMinute / 15)
      const scrollPosition = (currentSlot * 60) - 120 // 60px per slot, offset by 2 hours
      
      scrollRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  }, [currentDate])

  const getTaskPosition = (task: Task) => {
    const startHour = task.startTime.getHours()
    const startMinute = task.startTime.getMinutes()
    const endHour = task.endTime.getHours()
    const endMinute = task.endTime.getMinutes()

    const startSlot = ((startHour - TIME_SLOT_CONFIG.startHour) * 4) + (startMinute / 15)
    const endSlot = ((endHour - TIME_SLOT_CONFIG.startHour) * 4) + (endMinute / 15)
    const duration = endSlot - startSlot

    return {
      top: startSlot * 60, // 60px per 15-minute slot
      height: Math.max(duration * 60, 30), // Minimum 30px height
    }
  }

  const getCurrentTimePosition = () => {
    if (!isToday(currentDate)) return null
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    if (currentHour < TIME_SLOT_CONFIG.startHour || currentHour > TIME_SLOT_CONFIG.endHour) {
      return null
    }
    
    const currentSlot = ((currentHour - TIME_SLOT_CONFIG.startHour) * 4) + (currentMinute / 15)
    return currentSlot * 60
  }

  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="h-full flex flex-col">
      {/* Day Header */}
      <div className="p-4 border-b border-border bg-background sticky top-0 z-30">
        <div className="text-center">
          <div className="text-sm font-medium text-muted-foreground">
            {format(currentDate, 'EEEE')}
          </div>
          <div className={`text-2xl font-bold ${
            isToday(currentDate) ? 'text-primary' : 'text-foreground'
          }`}>
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          {isToday(currentDate) && (
            <div className="text-sm text-primary font-medium mt-1">Today</div>
          )}
        </div>
      </div>

      {/* Time Grid */}
      <div className="flex-1 relative overflow-auto" ref={scrollRef}>
        <div className="flex min-h-full">
          {/* Time Labels Column */}
          <div className="w-20 border-r border-border bg-muted/20 flex-shrink-0">
            {timeSlots.map((slot) => (
              <div
                key={slot.time}
                className={`h-15 border-b flex items-start justify-end pr-3 pt-1 ${
                  slot.isHour ? 'border-b-border' : 'border-b-border/30'
                }`}
                style={{ height: '60px' }}
              >
                {slot.isHour && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {format(new Date().setHours(slot.hour, 0), 'h')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date().setHours(slot.hour, 0), 'a')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative">
            {/* Time Slots */}
            {timeSlots.map((slot) => (
              <div
                key={slot.time}
                className={`time-slot border-b cursor-pointer ${
                  slot.isHour ? 'time-slot-hour' : 
                  slot.isHalfHour ? 'time-slot-half-hour' : 
                  'border-b-border/20'
                }`}
                style={{ height: '60px' }}
                onClick={() => onTimeSlotClick?.(currentDate, slot.time)}
              >
                {/* Quarter hour markers */}
                {slot.isQuarterHour && (
                  <div className="absolute left-0 w-2 h-px bg-border/40" />
                )}
              </div>
            ))}

            {/* Tasks */}
            {dayTasks.map((task, index) => {
              const position = getTaskPosition(task)
              return (
                <motion.div
                  key={task.id}
                  className="absolute left-2 right-2 z-20"
                  style={{
                    top: position.top,
                    height: position.height,
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.1 
                  }}
                >
                  <TaskBlock
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                    showTime
                    showDescription
                    className="h-full"
                  />
                </motion.div>
              )
            })}

            {/* Current Time Indicator */}
            {currentTimePosition !== null && (
              <motion.div
                className="absolute left-0 right-0 z-30 flex items-center"
                style={{ top: currentTimePosition }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border-2 border-white shadow-sm" />
                <div className="flex-1 h-0.5 bg-red-500" />
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md ml-2 font-medium">
                  {format(new Date(), 'h:mm a')}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {dayTasks.length === 0 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium mb-2">No tasks scheduled</div>
                  <div className="text-sm">Click on a time slot to add a task</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
