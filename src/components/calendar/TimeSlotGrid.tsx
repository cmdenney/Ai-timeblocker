'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { TIME_SLOT_CONFIG } from '@/types/tasks'

interface TimeSlotGridProps {
  date: Date
  onTimeSlotClick?: (date: Date, time: string) => void
  occupiedSlots?: string[]
  currentTime?: Date
  className?: string
}

export function TimeSlotGrid({ 
  date, 
  onTimeSlotClick, 
  occupiedSlots = [], 
  currentTime,
  className 
}: TimeSlotGridProps) {
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = TIME_SLOT_CONFIG.startHour; hour <= TIME_SLOT_CONFIG.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_CONFIG.slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const isOccupied = occupiedSlots.includes(time)
        const isCurrentTime = currentTime && 
          currentTime.getHours() === hour && 
          Math.floor(currentTime.getMinutes() / TIME_SLOT_CONFIG.slotDuration) * TIME_SLOT_CONFIG.slotDuration === minute

        slots.push({
          time,
          hour,
          minute,
          isHour: minute === 0,
          isHalfHour: minute === 30,
          isQuarterHour: minute === 15 || minute === 45,
          isOccupied,
          isCurrentTime
        })
      }
    }
    return slots
  }, [occupiedSlots, currentTime])

  const isWorkingHours = (hour: number) => {
    return hour >= 9 && hour <= 17 // 9 AM to 5 PM
  }

  const getEnergyLevel = (hour: number) => {
    if (hour >= 9 && hour <= 11) return 'high' // Morning peak
    if (hour >= 14 && hour <= 16) return 'medium' // Afternoon
    return 'low' // Early morning, lunch, evening
  }

  return (
    <div className={`grid grid-cols-1 ${className}`}>
      {timeSlots.map((slot, index) => (
        <motion.div
          key={slot.time}
          className={`
            time-slot h-4 relative
            ${slot.isHour ? 'time-slot-hour' : ''}
            ${slot.isHalfHour ? 'time-slot-half-hour' : ''}
            ${slot.isCurrentTime ? 'time-slot-current' : ''}
            ${slot.isOccupied ? 'time-slot-occupied bg-muted/50' : ''}
            ${isWorkingHours(slot.hour) ? 'bg-green-50/30' : 'bg-gray-50/20'}
          `}
          onClick={() => !slot.isOccupied && onTimeSlotClick?.(date, slot.time)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.01, duration: 0.2 }}
          whileHover={!slot.isOccupied ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {}}
        >
          {/* Hour Label */}
          {slot.isHour && (
            <div className="absolute -left-16 top-0 text-xs text-muted-foreground font-medium">
              {format(new Date().setHours(slot.hour, 0), 'h a')}
            </div>
          )}

          {/* Quarter Hour Markers */}
          {slot.isQuarterHour && (
            <div className="absolute left-0 top-1/2 w-2 h-px bg-border/40 -translate-y-1/2" />
          )}

          {/* Energy Level Indicator */}
          {slot.isHour && (
            <div className={`absolute right-1 top-1 w-1 h-1 rounded-full ${
              getEnergyLevel(slot.hour) === 'high' ? 'bg-green-400' :
              getEnergyLevel(slot.hour) === 'medium' ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
          )}

          {/* Working Hours Indicator */}
          {slot.isHour && isWorkingHours(slot.hour) && (
            <div className="absolute left-1 top-1 w-1 h-1 rounded-full bg-blue-400" />
          )}

          {/* Current Time Line */}
          {slot.isCurrentTime && (
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 -translate-y-1/2 z-10">
              <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
