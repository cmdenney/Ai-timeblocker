'use client'

import { motion } from 'framer-motion'
import { Brain, Sparkles, Clock, CheckCircle } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <div className={`loading-dots ${className}`}>
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
    </div>
  )
}

interface AIProcessingIndicatorProps {
  stage: 'parsing' | 'classifying' | 'scheduling' | 'complete'
  progress: number
  message: string
}

export function AIProcessingIndicator({ stage, progress, message }: AIProcessingIndicatorProps) {
  const getStageIcon = () => {
    switch (stage) {
      case 'parsing':
        return <Brain className="w-4 h-4 animate-pulse text-blue-500" />
      case 'classifying':
        return <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
      case 'scheduling':
        return <Clock className="w-4 h-4 animate-bounce text-orange-500" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getStageColor = () => {
    switch (stage) {
      case 'parsing':
        return 'bg-blue-500'
      case 'classifying':
        return 'bg-purple-500'
      case 'scheduling':
        return 'bg-orange-500'
      case 'complete':
        return 'bg-green-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {getStageIcon()}
        {message}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${getStageColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  )
}

interface CalendarSkeletonProps {
  view?: 'month' | 'week' | 'day'
}

export function CalendarSkeleton({ view = 'month' }: CalendarSkeletonProps) {
  if (view === 'month') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (view === 'week') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-2">
          <div />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <div className="grid grid-cols-8 gap-2">
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-16" />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              {Array.from({ length: 12 }).map((_, j) => (
                <Skeleton key={j} className="h-12" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-4">
        <div className="w-20 space-y-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="flex-1 space-y-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

interface TaskBlockSkeletonProps {
  count?: number
  compact?: boolean
}

export function TaskBlockSkeleton({ count = 3, compact = false }: TaskBlockSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`border rounded-md p-2 ${compact ? 'h-8' : 'h-16'}`}>
          <Skeleton className={`w-3/4 ${compact ? 'h-3' : 'h-4'} mb-1`} />
          {!compact && <Skeleton className="w-1/2 h-3" />}
        </div>
      ))}
    </div>
  )
}
