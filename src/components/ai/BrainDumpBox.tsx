'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Sparkles, Clock, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { Task } from '@/types/tasks'
import { TaskBlock } from '../tasks/TaskBlock'

interface BrainDumpBoxProps {
  onTasksGenerated?: (tasks: Task[]) => void
  className?: string
}

interface ProcessingState {
  stage: 'idle' | 'parsing' | 'classifying' | 'scheduling' | 'complete'
  progress: number
  message: string
}

export function BrainDumpBox({ onTasksGenerated, className }: BrainDumpBoxProps) {
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleBrainDump = async () => {
    if (!input.trim()) return

    setProcessing({ stage: 'parsing', progress: 10, message: 'Parsing your thoughts...' })
    
    try {
      // Call the AI API
      const response = await fetch('/api/ai/process-brain-dump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          userId: 'user-1' // This should come from auth context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process brain dump')
      }

      setProcessing({ stage: 'parsing', progress: 30, message: 'Extracting tasks and goals...' })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProcessing({ stage: 'classifying', progress: 60, message: 'Classifying with Eisenhower Matrix...' })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProcessing({ stage: 'scheduling', progress: 90, message: 'Optimizing your schedule...' })
      await new Promise(resolve => setTimeout(resolve, 500))

      const result = await response.json()
      
      if (result.success) {
        setGeneratedTasks(result.tasks)
        setProcessing({ stage: 'complete', progress: 100, message: `Generated ${result.tasks.length} tasks!` })
        onTasksGenerated?.(result.tasks)
      } else {
        // Fallback to mock tasks if API fails
        const mockTasks = generateMockTasks(input)
        setGeneratedTasks(mockTasks)
        setProcessing({ stage: 'complete', progress: 100, message: `Generated ${mockTasks.length} tasks! (Offline mode)` })
        onTasksGenerated?.(mockTasks)
      }
      
      // Reset after showing results
      setTimeout(() => {
        setProcessing({ stage: 'idle', progress: 0, message: '' })
        setInput('')
      }, 3000)
      
    } catch (error) {
      console.error('Brain dump processing error:', error)
      // Fallback to mock tasks
      const mockTasks = generateMockTasks(input)
      setGeneratedTasks(mockTasks)
      setProcessing({ stage: 'complete', progress: 100, message: `Generated ${mockTasks.length} tasks! (Offline mode)` })
      onTasksGenerated?.(mockTasks)
      
      setTimeout(() => {
        setProcessing({ stage: 'idle', progress: 0, message: '' })
        setInput('')
      }, 3000)
    }
  }

  const generateMockTasks = (text: string): Task[] => {
    // This is a mock implementation - in reality, this would call your AI API
    const words = text.toLowerCase()
    const tasks: Task[] = []
    
    // Simple keyword-based task generation for demo
    if (words.includes('meeting') || words.includes('call')) {
      tasks.push(createMockTask('Team meeting', 'Q2', 'work', 'high', 60))
    }
    if (words.includes('email') || words.includes('respond')) {
      tasks.push(createMockTask('Respond to emails', 'Q3', 'work', 'low', 30))
    }
    if (words.includes('exercise') || words.includes('gym')) {
      tasks.push(createMockTask('Exercise session', 'Q2', 'health', 'medium', 45))
    }
    if (words.includes('project') || words.includes('work on')) {
      tasks.push(createMockTask('Work on project', 'Q1', 'work', 'high', 120))
    }
    if (words.includes('learn') || words.includes('study')) {
      tasks.push(createMockTask('Learning session', 'Q2', 'learning', 'high', 90))
    }
    
    // Always add a few generic tasks
    if (tasks.length === 0) {
      tasks.push(
        createMockTask('Review and plan day', 'Q2', 'work', 'medium', 15),
        createMockTask('Process inbox', 'Q3', 'work', 'low', 20),
        createMockTask('Focus work block', 'Q1', 'work', 'high', 90)
      )
    }
    
    return tasks
  }

  const createMockTask = (
    title: string, 
    quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    category: Task['category'],
    energy: Task['energyLevel'],
    duration: number
  ): Task => {
    const now = new Date()
    const startTime = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000) // Random time in next 24 hours
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      title,
      startTime,
      endTime,
      duration,
      eisenhowerQuadrant: quadrant,
      category,
      priority: quadrant === 'Q1' ? 'urgent' : quadrant === 'Q2' ? 'high' : quadrant === 'Q3' ? 'medium' : 'low',
      status: 'pending',
      isCompleted: false,
      userId: 'user-1',
      aiGenerated: true,
      energyLevel: energy,
      tags: [],
      createdAt: now,
      updatedAt: now,
      originalText: input,
      aiConfidence: 0.85 + Math.random() * 0.15
    }
  }

  const getStageIcon = () => {
    switch (processing.stage) {
      case 'parsing':
        return <Brain className="w-4 h-4 animate-pulse" />
      case 'classifying':
        return <Sparkles className="w-4 h-4 animate-spin" />
      case 'scheduling':
        return <Clock className="w-4 h-4 animate-bounce" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  return (
    <Card className={`transition-all duration-300 ${isExpanded ? 'shadow-lg' : 'shadow-sm'} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          Brain Dump
          <span className="text-sm font-normal text-muted-foreground">
            - Just write everything on your mind...
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => !input && setIsExpanded(false)}
            placeholder="Dump everything here... meetings, deadlines, ideas, tasks, goals, worries - I'll organize it all for you!"
            className="min-h-[120px] resize-none text-base leading-relaxed"
            disabled={processing.stage !== 'idle'}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {input.length}/2000
          </div>
        </div>

        {/* Processing State */}
        <AnimatePresence>
          {processing.stage !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {getStageIcon()}
                  {processing.message}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${processing.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Tasks Preview */}
        <AnimatePresence>
          {generatedTasks.length > 0 && processing.stage === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="w-4 h-4" />
                Generated {generatedTasks.length} tasks
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generatedTasks.map((task) => (
                  <TaskBlock
                    key={task.id}
                    task={task}
                    compact
                    showTime={false}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleBrainDump}
            disabled={!input.trim() || processing.stage !== 'idle'}
            className="flex-1"
          >
            {processing.stage !== 'idle' ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Organize My Thoughts
              </>
            )}
          </Button>
          
          {input && (
            <Button
              variant="outline"
              onClick={() => {
                setInput('')
                setGeneratedTasks([])
                setIsExpanded(false)
              }}
              disabled={processing.stage !== 'idle'}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Tips */}
        {isExpanded && processing.stage === 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-muted-foreground space-y-1 border-t pt-3"
          >
            <div className="font-medium">💡 Tips for better results:</div>
            <ul className="space-y-1 ml-4">
              <li>• Include deadlines: "presentation due Friday"</li>
              <li>• Mention energy levels: "need to focus on..."</li>
              <li>• Add context: "30-minute call with client"</li>
              <li>• Include priorities: "urgent", "important", "can wait"</li>
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
