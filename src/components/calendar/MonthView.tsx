'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import { Task, EISENHOWER_QUADRANTS } from '@/types/tasks'
import { TaskBlock } from '../tasks/TaskBlock'

interface MonthViewProps {
  currentDate: Date
  tasks: Task[]
  onDateClick?: (date: Date) => void
  onTaskClick?: (task: Task) => void
}

export function MonthView({ currentDate, tasks, onDateClick, onTaskClick }: MonthViewProps) {
  const { monthStart, monthEnd, calendarStart, calendarEnd, weeks } = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const weeks = []
    let currentWeekStart = calendarStart

    while (currentWeekStart <= calendarEnd) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const day = addDays(currentWeekStart, i)
        const dayTasks = tasks.filter(task => 
          isSameDay(task.startTime, day)
        ).sort((a, b) => {
          // Sort by Eisenhower quadrant priority, then by start time
          const priorityA = EISENHOWER_QUADRANTS[a.eisenhowerQuadrant].priority
          const priorityB = EISENHOWER_QUADRANTS[b.eisenhowerQuadrant].priority
          if (priorityA !== priorityB) return priorityB - priorityA
          return a.startTime.getTime() - b.startTime.getTime()
        })

        week.push({
          date: day,
          tasks: dayTasks,
          isCurrentMonth: isSameMonth(day, monthStart),
          isToday: isToday(day)
        })
      }
      weeks.push(week)
      currentWeekStart = addDays(currentWeekStart, 7)
    }

    return { monthStart, monthEnd, calendarStart, calendarEnd, weeks }
  }, [currentDate, tasks])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-full flex flex-col">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-rows-6 gap-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0">
            {week.map((day, dayIndex) => (
              <motion.div
                key={day.date.toISOString()}
                className={`calendar-cell ${
                  day.isToday ? 'calendar-cell-today' : ''
                } ${
                  !day.isCurrentMonth ? 'calendar-cell-other-month' : ''
                }`}
                onClick={() => onDateClick?.(day.date)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: (weekIndex * 7 + dayIndex) * 0.01,
                  duration: 0.3 
                }}
              >
                {/* Date Number */}
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${
                    day.isToday 
                      ? 'text-primary font-bold' 
                      : day.isCurrentMonth 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                  }`}>
                    {format(day.date, 'd')}
                  </span>
                  
                  {day.isToday && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-1 overflow-hidden">
                  {day.tasks.slice(0, 3).map((task) => (
                    <TaskBlock
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      compact
                      showTime={false}
                    />
                  ))}
                  
                  {day.tasks.length > 3 && (
                    <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                      +{day.tasks.length - 3} more
                    </div>
                  )}
                </div>

                {/* Energy Level Indicator */}
                {day.tasks.length > 0 && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {day.tasks.some(t => t.energyLevel === 'high') && (
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    )}
                    {day.tasks.some(t => t.energyLevel === 'medium') && (
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    )}
                    {day.tasks.some(t => t.energyLevel === 'low') && (
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
