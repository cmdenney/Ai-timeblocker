'use client'

import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { Task, TIME_SLOT_CONFIG } from '@/types/tasks'
import { TimeSlotGrid } from './TimeSlotGrid'
import { TaskBlock } from '../tasks/TaskBlock'

interface WeekViewProps {
  currentDate: Date
  tasks: Task[]
  onDateClick?: (date: Date) => void
  onTaskClick?: (task: Task) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  onTaskMove?: (taskId: string, newStartTime: Date, newEndTime: Date) => void
}

export function WeekView({ 
  currentDate, 
  tasks, 
  onDateClick, 
  onTaskClick, 
  onTimeSlotClick, 
  onTaskMove 
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dayTasks = tasks.filter(task => 
        isSameDay(task.startTime, day)
      ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

      weekDays.push({
        date: day,
        tasks: dayTasks,
        isToday: isToday(day)
      })
    }

    return { weekStart, weekEnd, weekDays }
  }, [currentDate, tasks])

  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = TIME_SLOT_CONFIG.startHour; hour <= TIME_SLOT_CONFIG.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_CONFIG.slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time,
          hour,
          minute,
          isHour: minute === 0,
          isHalfHour: minute === 30
        })
      }
    }
    return slots
  }, [])

  const getTaskPosition = (task: Task, dayIndex: number) => {
    const startHour = task.startTime.getHours()
    const startMinute = task.startTime.getMinutes()
    const endHour = task.endTime.getHours()
    const endMinute = task.endTime.getMinutes()

    const startSlot = ((startHour - TIME_SLOT_CONFIG.startHour) * 4) + (startMinute / 15)
    const endSlot = ((endHour - TIME_SLOT_CONFIG.startHour) * 4) + (endMinute / 15)
    const duration = endSlot - startSlot

    return {
      top: `${(startSlot * 100) / TIME_SLOT_CONFIG.totalSlots}%`,
      height: `${(duration * 100) / TIME_SLOT_CONFIG.totalSlots}%`,
      left: `${(dayIndex * 100) / 7}%`,
      width: `${100 / 7}%`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Week Day Headers */}
      <div className="grid grid-cols-8 border-b border-border bg-background sticky top-0 z-30">
        <div className="p-3 border-r border-border" /> {/* Time column header */}
        {weekDays.map((day) => (
          <motion.div
            key={day.date.toISOString()}
            className={`p-3 text-center border-r border-border last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors ${
              day.isToday ? 'bg-primary/5' : ''
            }`}
            onClick={() => onDateClick?.(day.date)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-sm font-medium text-muted-foreground">
              {format(day.date, 'EEE')}
            </div>
            <div className={`text-lg font-semibold ${
              day.isToday ? 'text-primary' : 'text-foreground'
            }`}>
              {format(day.date, 'd')}
            </div>
            {day.isToday && (
              <div className="w-2 h-2 bg-primary rounded-full mx-auto mt-1" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 relative overflow-auto" ref={scrollRef}>
        <div className="grid grid-cols-8 min-h-full">
          {/* Time Labels Column */}
          <div className="border-r border-border bg-muted/20">
            {timeSlots.map((slot) => (
              <div
                key={slot.time}
                className={`h-4 border-b border-border/30 flex items-center justify-end pr-2 ${
                  slot.isHour ? 'border-b-border' : ''
                }`}
              >
                {slot.isHour && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(new Date().setHours(slot.hour, 0), 'h a')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={day.date.toISOString()} className="relative border-r border-border last:border-r-0">
              {/* Time Slots */}
              {timeSlots.map((slot) => (
                <div
                  key={`${day.date.toISOString()}-${slot.time}`}
                  className={`time-slot h-4 ${
                    slot.isHour ? 'time-slot-hour' : slot.isHalfHour ? 'time-slot-half-hour' : ''
                  }`}
                  onClick={() => onTimeSlotClick?.(day.date, slot.time)}
                />
              ))}

              {/* Tasks */}
              {day.tasks.map((task) => {
                const position = getTaskPosition(task, 0) // dayIndex is handled by column
                return (
                  <motion.div
                    key={task.id}
                    className="absolute inset-x-1 z-20"
                    style={{
                      top: position.top,
                      height: position.height,
                      minHeight: '20px'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskBlock
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      showTime
                      className="h-full"
                    />
                  </motion.div>
                )
              })}

              {/* Current Time Indicator */}
              {day.isToday && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-30"
                  style={{
                    top: `${((new Date().getHours() - TIME_SLOT_CONFIG.startHour) * 4 + (new Date().getMinutes() / 15)) * 100 / TIME_SLOT_CONFIG.totalSlots}%`
                  }}
                >
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
