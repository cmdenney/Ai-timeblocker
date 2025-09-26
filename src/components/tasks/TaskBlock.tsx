'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Clock, MapPin, User, AlertCircle } from 'lucide-react'
import { Task, EISENHOWER_QUADRANTS, TASK_CATEGORY_COLORS } from '@/types/tasks'
import { cn } from '@/lib/utils'

interface TaskBlockProps {
  task: Task
  onClick?: () => void
  compact?: boolean
  showTime?: boolean
  showDescription?: boolean
  className?: string
  isDragging?: boolean
}

export function TaskBlock({ 
  task, 
  onClick, 
  compact = false, 
  showTime = true, 
  showDescription = false,
  className,
  isDragging = false
}: TaskBlockProps) {
  const quadrant = EISENHOWER_QUADRANTS[task.eisenhowerQuadrant]
  const categoryColor = TASK_CATEGORY_COLORS[task.category]

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return '✓'
      case 'in_progress':
        return '⏳'
      case 'blocked':
        return '🚫'
      case 'cancelled':
        return '❌'
      default:
        return null
    }
  }

  const getEnergyIndicator = () => {
    switch (task.energyLevel) {
      case 'high':
        return '🔥'
      case 'medium':
        return '⚡'
      case 'low':
        return '💤'
      default:
        return null
    }
  }

  return (
    <motion.div
      className={cn(
        'task-block',
        quadrant.color,
        quadrant.darkColor,
        compact ? 'py-0.5 px-1' : 'py-2 px-3',
        isDragging && 'task-block-dragging',
        task.status === 'completed' && 'opacity-75 line-through',
        task.status === 'cancelled' && 'opacity-50',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: compact ? 1.02 : 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={cn(
            'font-medium truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {getStatusIcon() && (
              <span className="mr-1">{getStatusIcon()}</span>
            )}
            {task.title}
          </div>

          {/* Time */}
          {showTime && !compact && (
            <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
              <Clock className="w-3 h-3" />
              <span>
                {format(task.startTime, 'h:mm a')} - {format(task.endTime, 'h:mm a')}
              </span>
            </div>
          )}
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Priority Indicator */}
          <div className="text-xs opacity-75">
            {quadrant.icon}
          </div>

          {/* Energy Level */}
          {!compact && (
            <div className="text-xs">
              {getEnergyIndicator()}
            </div>
          )}

          {/* AI Generated Badge */}
          {task.aiGenerated && !compact && (
            <div className="w-2 h-2 bg-blue-400 rounded-full" title="AI Generated" />
          )}
        </div>
      </div>

      {/* Description */}
      {showDescription && task.description && !compact && (
        <div className="text-xs opacity-75 mt-1 line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Footer Info */}
      {!compact && (
        <div className="flex items-center justify-between mt-2 text-xs opacity-75">
          <div className="flex items-center gap-2">
            {/* Location */}
            {task.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-20">{task.location}</span>
              </div>
            )}

            {/* Category */}
            <div className={cn(
              'px-1.5 py-0.5 rounded text-xs font-medium',
              categoryColor
            )}>
              {task.category}
            </div>
          </div>

          {/* Duration */}
          <div className="text-xs opacity-60">
            {task.duration}m
          </div>
        </div>
      )}

      {/* Progress Bar for In-Progress Tasks */}
      {task.status === 'in_progress' && !compact && (
        <div className="mt-2">
          <div className="w-full bg-black/10 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all duration-300"
              style={{ width: '60%' }} // This could be dynamic based on actual progress
            />
          </div>
        </div>
      )}

      {/* Subtasks Indicator */}
      {task.subtasks && task.subtasks.length > 0 && !compact && (
        <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
          <User className="w-3 h-3" />
          <span>{task.subtasks.length} subtasks</span>
        </div>
      )}

      {/* Dependencies Warning */}
      {task.dependencies && task.dependencies.length > 0 && !compact && (
        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
          <AlertCircle className="w-3 h-3" />
          <span>Has dependencies</span>
        </div>
      )}

      {/* AI Confidence Indicator */}
      {task.aiGenerated && task.aiConfidence && task.aiConfidence < 0.8 && !compact && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" 
             title={`AI Confidence: ${Math.round(task.aiConfidence * 100)}%`} />
      )}
    </motion.div>
  )
}
