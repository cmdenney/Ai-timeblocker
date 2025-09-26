import { NextRequest, NextResponse } from 'next/server'
import { TaskClassifier } from '@/lib/ai/task-classifier'
import { Task, EisenhowerQuadrant, TaskCategory, EnergyLevel } from '@/types/tasks'

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json()

    if (!text || !userId) {
      return NextResponse.json(
        { error: 'Text and userId are required' },
        { status: 400 }
      )
    }

    // Step 1: Parse tasks from text
    const parsedTasks = await TaskClassifier.parseTasksFromText(text)

    // Step 2: Classify each task
    const classifiedTasks: Task[] = []
    
    for (const parsedTask of parsedTasks) {
      const classification = await TaskClassifier.classifyTask(parsedTask)
      
      // Create a proper Task object
      const now = new Date()
      const startTime = parsedTask.deadline || new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + classification.estimatedDuration * 60 * 1000)
      
      const task: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: parsedTask.title,
        description: parsedTask.description,
        startTime,
        endTime,
        duration: classification.estimatedDuration,
        eisenhowerQuadrant: classification.eisenhowerQuadrant,
        category: classification.category,
        priority: classification.eisenhowerQuadrant === 'Q1' ? 'urgent' : 
                 classification.eisenhowerQuadrant === 'Q2' ? 'high' :
                 classification.eisenhowerQuadrant === 'Q3' ? 'medium' : 'low',
        status: 'pending',
        isCompleted: false,
        userId,
        aiGenerated: true,
        energyLevel: classification.energyLevel,
        tags: [],
        createdAt: now,
        updatedAt: now,
        originalText: text,
        aiConfidence: classification.confidence
      }
      
      classifiedTasks.push(task)
    }

    // Step 3: Generate optimized schedule
    const userPreferences = {
      workingHours: { start: '09:00', end: '17:00' },
      workingDays: [1, 2, 3, 4, 5], // Mon-Fri
      energyPeakHours: {
        high: ['09:00', '10:00', '11:00'],
        medium: ['14:00', '15:00', '16:00'],
        low: ['13:00', '17:00', '18:00']
      },
      bufferTime: 15 // 15 minutes between tasks
    }

    const scheduledTasks = await TaskClassifier.generateSchedule(classifiedTasks, userPreferences)

    return NextResponse.json({
      success: true,
      tasks: scheduledTasks,
      summary: {
        totalTasks: scheduledTasks.length,
        quadrantBreakdown: {
          Q1: scheduledTasks.filter(t => t.eisenhowerQuadrant === 'Q1').length,
          Q2: scheduledTasks.filter(t => t.eisenhowerQuadrant === 'Q2').length,
          Q3: scheduledTasks.filter(t => t.eisenhowerQuadrant === 'Q3').length,
          Q4: scheduledTasks.filter(t => t.eisenhowerQuadrant === 'Q4').length,
        },
        averageConfidence: scheduledTasks.reduce((acc, t) => acc + (t.aiConfidence || 0), 0) / scheduledTasks.length
      }
    })

  } catch (error) {
    console.error('Error processing brain dump:', error)
    return NextResponse.json(
      { error: 'Failed to process brain dump' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'AI Brain Dump Processor',
    timestamp: new Date().toISOString()
  })
}
