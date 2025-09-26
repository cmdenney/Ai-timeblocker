import { OpenAI } from 'openai'
import { Task, EisenhowerQuadrant, EnergyLevel, TaskCategory, AI_CLASSIFICATION_PROMPTS } from '@/types/tasks'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ClassificationResult {
  eisenhowerQuadrant: EisenhowerQuadrant
  energyLevel: EnergyLevel
  category: TaskCategory
  estimatedDuration: number
  confidence: number
  reasoning?: string
}

export interface ParsedTask {
  title: string
  description?: string
  deadline?: Date
  estimatedDuration?: number
  context?: string
  priority?: string
  energyHints?: string[]
}

export class TaskClassifier {
  /**
   * Parse natural language text into structured tasks
   */
  static async parseTasksFromText(text: string): Promise<ParsedTask[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert task parser. Extract individual tasks from the user's brain dump text.
            
            For each task, identify:
            - Title (clear, actionable)
            - Description (optional details)
            - Deadline (if mentioned)
            - Estimated duration (in minutes)
            - Context (work, personal, etc.)
            - Priority indicators (urgent, important, etc.)
            - Energy hints (focus, creative, routine, etc.)
            
            Return a JSON array of tasks. Be generous in extracting tasks - even small items count.
            
            Example output:
            [
              {
                "title": "Prepare presentation for client meeting",
                "description": "Create slides and practice delivery",
                "deadline": "2024-01-15T14:00:00Z",
                "estimatedDuration": 120,
                "context": "work",
                "priority": "urgent important",
                "energyHints": ["focus", "creative"]
              }
            ]`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from OpenAI')

      return JSON.parse(content)
    } catch (error) {
      console.error('Error parsing tasks:', error)
      // Fallback to simple parsing
      return this.fallbackTaskParsing(text)
    }
  }

  /**
   * Classify a task using the Eisenhower Matrix
   */
  static async classifyTask(task: ParsedTask): Promise<ClassificationResult> {
    try {
      const prompt = AI_CLASSIFICATION_PROMPTS.eisenhower
        .replace('{task}', task.title)
        .replace('{context}', task.description || task.context || '')

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert in the Eisenhower Matrix for task prioritization. 
            Analyze tasks and classify them into the correct quadrant based on urgency and importance.
            
            Respond with a JSON object containing:
            {
              "quadrant": "Q1|Q2|Q3|Q4",
              "energyLevel": "high|medium|low",
              "category": "work|personal|health|learning|social|maintenance|creative|other",
              "estimatedDuration": number_in_minutes,
              "confidence": number_between_0_and_1,
              "reasoning": "brief explanation"
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No classification response')

      const result = JSON.parse(content)
      
      return {
        eisenhowerQuadrant: result.quadrant,
        energyLevel: result.energyLevel,
        category: result.category,
        estimatedDuration: result.estimatedDuration || task.estimatedDuration || 30,
        confidence: result.confidence,
        reasoning: result.reasoning
      }
    } catch (error) {
      console.error('Error classifying task:', error)
      // Fallback classification
      return this.fallbackClassification(task)
    }
  }

  /**
   * Generate optimized schedule for tasks
   */
  static async generateSchedule(
    tasks: Task[], 
    preferences: {
      workingHours: { start: string; end: string }
      workingDays: number[]
      energyPeakHours: { high: string[]; medium: string[]; low: string[] }
      bufferTime: number
    }
  ): Promise<Task[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert scheduler. Optimize the given tasks based on:
            1. Eisenhower Matrix priorities (Q1 first, then Q2, Q3, Q4)
            2. Energy levels matching peak hours
            3. Working hours and days
            4. Buffer time between tasks
            5. Task dependencies
            
            Return the tasks with optimized start and end times as ISO strings.
            Ensure no overlaps and respect the user's preferences.`
          },
          {
            role: 'user',
            content: JSON.stringify({ tasks, preferences })
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No scheduling response')

      return JSON.parse(content)
    } catch (error) {
      console.error('Error generating schedule:', error)
      // Fallback to simple scheduling
      return this.fallbackScheduling(tasks, preferences)
    }
  }

  /**
   * Fallback task parsing when AI fails
   */
  private static fallbackTaskParsing(text: string): ParsedTask[] {
    const lines = text.split('\n').filter(line => line.trim())
    const tasks: ParsedTask[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length < 3) continue

      // Simple heuristics
      const isUrgent = /urgent|asap|today|now|deadline/i.test(trimmed)
      const isImportant = /important|critical|key|must|need/i.test(trimmed)
      const hasTime = /\d+\s*(min|hour|hr)/i.test(trimmed)
      
      let estimatedDuration = 30 // default
      const timeMatch = trimmed.match(/(\d+)\s*(min|hour|hr)/i)
      if (timeMatch) {
        const num = parseInt(timeMatch[1])
        const unit = timeMatch[2].toLowerCase()
        estimatedDuration = unit.startsWith('hour') || unit === 'hr' ? num * 60 : num
      }

      tasks.push({
        title: trimmed.replace(/\d+\s*(min|hour|hr)/i, '').trim(),
        estimatedDuration,
        priority: `${isUrgent ? 'urgent ' : ''}${isImportant ? 'important' : ''}`.trim(),
        context: /work|job|office|meeting|call/i.test(trimmed) ? 'work' : 'personal'
      })
    }

    return tasks
  }

  /**
   * Fallback classification when AI fails
   */
  private static fallbackClassification(task: ParsedTask): ClassificationResult {
    const text = `${task.title} ${task.description || ''} ${task.priority || ''}`.toLowerCase()
    
    const isUrgent = /urgent|asap|today|deadline|due/.test(text)
    const isImportant = /important|critical|key|must|project|goal/.test(text)
    
    let quadrant: EisenhowerQuadrant
    if (isUrgent && isImportant) quadrant = 'Q1'
    else if (!isUrgent && isImportant) quadrant = 'Q2'
    else if (isUrgent && !isImportant) quadrant = 'Q3'
    else quadrant = 'Q4'

    const isHighEnergy = /focus|creative|think|plan|design|write/.test(text)
    const isLowEnergy = /email|organize|file|sort|routine/.test(text)
    
    const energyLevel: EnergyLevel = isHighEnergy ? 'high' : isLowEnergy ? 'low' : 'medium'
    
    const isWork = /work|job|office|meeting|call|project/.test(text)
    const isHealth = /exercise|gym|health|doctor|workout/.test(text)
    const isLearning = /learn|study|read|course|training/.test(text)
    
    let category: TaskCategory = 'other'
    if (isWork) category = 'work'
    else if (isHealth) category = 'health'
    else if (isLearning) category = 'learning'
    else category = 'personal'

    return {
      eisenhowerQuadrant: quadrant,
      energyLevel,
      category,
      estimatedDuration: task.estimatedDuration || 30,
      confidence: 0.6 // Lower confidence for fallback
    }
  }

  /**
   * Fallback scheduling when AI fails
   */
  private static fallbackScheduling(
    tasks: Task[], 
    preferences: any
  ): Task[] {
    // Simple scheduling: sort by priority and assign sequential times
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { Q1: 4, Q2: 3, Q3: 2, Q4: 1 }
      return priorityOrder[b.eisenhowerQuadrant] - priorityOrder[a.eisenhowerQuadrant]
    })

    const [startHour, startMinute] = preferences.workingHours.start.split(':').map(Number)
    let currentTime = new Date()
    currentTime.setHours(startHour, startMinute, 0, 0)

    return sortedTasks.map(task => {
      const startTime = new Date(currentTime)
      const endTime = new Date(currentTime.getTime() + task.duration * 60 * 1000)
      
      // Add buffer time
      currentTime = new Date(endTime.getTime() + preferences.bufferTime * 60 * 1000)
      
      return {
        ...task,
        startTime,
        endTime
      }
    })
  }
}
