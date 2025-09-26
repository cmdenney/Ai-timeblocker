'use client'

import { useState, useEffect } from 'react'
import { CalendarViewManager } from '@/components/calendar/CalendarViewManager'
import { BrainDumpBox } from '@/components/ai/BrainDumpBox'
import { TaskBlock } from '@/components/tasks/TaskBlock'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Brain, Zap, Target } from 'lucide-react'
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { AuthService } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'
import { Task, EISENHOWER_QUADRANTS, EisenhowerQuadrant, TaskCategory, EnergyLevel } from '@/types/tasks'
import { MainLayout } from '@/components/layout/main-layout'

export default function CalendarPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Form state for new tasks
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    category: 'work' as TaskCategory,
    eisenhowerQuadrant: 'Q2' as EisenhowerQuadrant,
    energyLevel: 'medium' as EnergyLevel,
    priority: 'medium' as Task['priority']
  })

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        if (!currentUser) {
          router.push('/auth/signin')
          return
        }
        setUser(currentUser)
        loadTasks()
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const loadTasks = async () => {
    // Mock tasks for demonstration - replace with actual API call
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Team Standup Meeting',
        description: 'Daily team sync and planning',
        startTime: new Date(2024, 11, 15, 9, 0),
        endTime: new Date(2024, 11, 15, 9, 30),
        duration: 30,
        eisenhowerQuadrant: 'Q3',
        category: 'work',
        priority: 'medium',
        status: 'pending',
        isCompleted: false,
        userId: 'user-1',
        aiGenerated: false,
        energyLevel: 'low',
        tags: ['meeting', 'team'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Deep Work: Project Architecture',
        description: 'Design system architecture for new project',
        startTime: new Date(2024, 11, 15, 10, 0),
        endTime: new Date(2024, 11, 15, 12, 0),
        duration: 120,
        eisenhowerQuadrant: 'Q1',
        category: 'work',
        priority: 'urgent',
        status: 'in_progress',
        isCompleted: false,
        userId: 'user-1',
        aiGenerated: false,
        energyLevel: 'high',
        tags: ['focus', 'architecture'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Lunch & Walk',
        description: 'Take a break and get some fresh air',
        startTime: new Date(2024, 11, 15, 12, 0),
        endTime: new Date(2024, 11, 15, 13, 0),
        duration: 60,
        eisenhowerQuadrant: 'Q2',
        category: 'health',
        priority: 'medium',
        status: 'pending',
        isCompleted: false,
        userId: 'user-1',
        aiGenerated: false,
        energyLevel: 'low',
        tags: ['break', 'health'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        title: 'Review and respond to emails',
        description: 'Process inbox and respond to important emails',
        startTime: new Date(2024, 11, 15, 14, 0),
        endTime: new Date(2024, 11, 15, 14, 30),
        duration: 30,
        eisenhowerQuadrant: 'Q3',
        category: 'work',
        priority: 'low',
        status: 'pending',
        isCompleted: false,
        userId: 'user-1',
        aiGenerated: true,
        energyLevel: 'low',
        tags: ['email', 'communication'],
        createdAt: new Date(),
        updatedAt: new Date(),
        aiConfidence: 0.9
      }
    ]
    setTasks(mockTasks)
  }

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task)
    // Handle task click - could open edit dialog
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const startTime = new Date(date)
    startTime.setHours(hours, minutes, 0, 0)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour default

    setSelectedDate(date)
    setNewTask(prev => ({
      ...prev,
      startTime: format(startTime, 'yyyy-MM-dd\'T\'HH:mm'),
      endTime: format(endTime, 'yyyy-MM-dd\'T\'HH:mm')
    }))
    setIsTaskDialogOpen(true)
  }

  const handleTaskMove = (taskId: string, newStartTime: Date, newEndTime: Date) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, startTime: newStartTime, endTime: newEndTime }
        : task
    ))
  }

  const handleTasksGenerated = (generatedTasks: Task[]) => {
    setTasks(prev => [...prev, ...generatedTasks])
  }

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.startTime || !newTask.endTime) return

    const startTime = new Date(newTask.startTime)
    const endTime = new Date(newTask.endTime)
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      startTime,
      endTime,
      duration,
      eisenhowerQuadrant: newTask.eisenhowerQuadrant,
      category: newTask.category,
      priority: newTask.priority,
      status: 'pending',
      isCompleted: false,
      userId: 'user-1',
      aiGenerated: false,
      energyLevel: newTask.energyLevel,
      tags: [],
      location: newTask.location,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTasks(prev => [...prev, task])
    setIsTaskDialogOpen(false)
    setNewTask({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      category: 'work',
      eisenhowerQuadrant: 'Q2',
      energyLevel: 'medium',
      priority: 'medium'
    })
  }

  const getTodaysTasks = () => {
    return tasks.filter(task => isToday(task.startTime))
  }

  const getWeeklyStats = () => {
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    const weekTasks = tasks.filter(task => 
      task.startTime >= weekStart && task.startTime <= weekEnd
    )

    const quadrantCounts = {
      Q1: weekTasks.filter(t => t.eisenhowerQuadrant === 'Q1').length,
      Q2: weekTasks.filter(t => t.eisenhowerQuadrant === 'Q2').length,
      Q3: weekTasks.filter(t => t.eisenhowerQuadrant === 'Q3').length,
      Q4: weekTasks.filter(t => t.eisenhowerQuadrant === 'Q4').length,
    }

    return { weekTasks: weekTasks.length, quadrantCounts }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your AI-powered calendar...</p>
        </div>
      </div>
    )
  }

  const todaysTasks = getTodaysTasks()
  const weeklyStats = getWeeklyStats()

  return (
    <MainLayout user={user}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              AI TimeBlocker
            </h1>
            <p className="text-muted-foreground">
              Intelligent time management powered by the Eisenhower Matrix
            </p>
          </div>
          
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your calendar. The AI will help classify it using the Eisenhower Matrix.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newTask.startTime}
                      onChange={(e) => setNewTask(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={newTask.endTime}
                      onChange={(e) => setNewTask(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quadrant">Eisenhower Quadrant</Label>
                    <Select value={newTask.eisenhowerQuadrant} onValueChange={(value) => setNewTask(prev => ({ ...prev, eisenhowerQuadrant: value as EisenhowerQuadrant }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quadrant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 - Do First (Urgent + Important)</SelectItem>
                        <SelectItem value="Q2">Q2 - Schedule (Important)</SelectItem>
                        <SelectItem value="Q3">Q3 - Delegate (Urgent)</SelectItem>
                        <SelectItem value="Q4">Q4 - Eliminate (Neither)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="energy">Energy Level</Label>
                    <Select value={newTask.energyLevel} onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value as EnergyLevel }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select energy level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">🔥 High Energy</SelectItem>
                        <SelectItem value="medium">⚡ Medium Energy</SelectItem>
                        <SelectItem value="low">💤 Low Energy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTask.category} onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value as TaskCategory }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newTask.location}
                      onChange={(e) => setNewTask(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location (optional)"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Brain Dump Box */}
            <BrainDumpBox onTasksGenerated={handleTasksGenerated} />
            
            {/* Calendar */}
            <Card className="flex-1">
              <CardContent className="p-0 h-full">
                <CalendarViewManager
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onTaskMove={handleTaskMove}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Today&apos;s Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todaysTasks.map(task => (
                    <TaskBlock
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task)}
                      compact
                      showTime
                    />
                  ))}
                  {todaysTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tasks scheduled for today</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Eisenhower Matrix Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  This Week&apos;s Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(weeklyStats.quadrantCounts).map(([quadrant, count]) => {
                    const quadrantInfo = EISENHOWER_QUADRANTS[quadrant as EisenhowerQuadrant]
                    return (
                      <div key={quadrant} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{quadrantInfo.icon}</span>
                          <span className="text-sm font-medium">{quadrantInfo.name}</span>
                        </div>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    )
                  })}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Tasks</span>
                      <span className="text-sm font-medium">{weeklyStats.weekTasks}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="font-medium text-blue-800">Focus Recommendation</p>
                    <p className="text-blue-700">Schedule high-energy tasks between 9-11 AM for optimal productivity.</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <p className="font-medium text-orange-800">Balance Alert</p>
                    <p className="text-orange-700">You have {weeklyStats.quadrantCounts.Q1} urgent tasks. Consider delegating Q3 items.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}