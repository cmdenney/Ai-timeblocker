'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Task } from '@/types/tasks'

interface DragDropContextType {
  isDragging: boolean
  draggedTask: Task | null
  onDragStart: (task: Task) => void
  onDragEnd: () => void
}

const DragDropContextProvider = createContext<DragDropContextType | null>(null)

export const useDragDrop = () => {
  const context = useContext(DragDropContextProvider)
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider')
  }
  return context
}

interface DragDropProviderProps {
  children: ReactNode
  onTaskMove?: (taskId: string, newStartTime: Date, newEndTime: Date) => void
}

export function DragDropProvider({ children, onTaskMove }: DragDropProviderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const handleDragStart = (task: Task) => {
    setIsDragging(true)
    setDraggedTask(task)
  }

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)
    setDraggedTask(null)

    if (!result.destination || !draggedTask) {
      return
    }

    // Parse the destination to get new time slot
    const destinationId = result.destination.droppableId
    const [date, time] = destinationId.split('_')
    
    if (date && time) {
      const newDate = new Date(date)
      const [hours, minutes] = time.split(':').map(Number)
      newDate.setHours(hours, minutes, 0, 0)
      
      const newStartTime = newDate
      const newEndTime = new Date(newStartTime.getTime() + draggedTask.duration * 60 * 1000)
      
      onTaskMove?.(draggedTask.id, newStartTime, newEndTime)
    }
  }

  const contextValue: DragDropContextType = {
    isDragging,
    draggedTask,
    onDragStart: handleDragStart,
    onDragEnd: () => setIsDragging(false)
  }

  return (
    <DragDropContextProvider.Provider value={contextValue}>
      <DragDropContext onDragStart={(start) => {
        // Find the task being dragged
        // This would need to be implemented based on your data structure
        setIsDragging(true)
      }} onDragEnd={handleDragEnd}>
        {children}
      </DragDropContext>
    </DragDropContextProvider.Provider>
  )
}

interface DroppableTimeSlotProps {
  date: Date
  time: string
  children: ReactNode
  isOccupied?: boolean
}

export function DroppableTimeSlot({ date, time, children, isOccupied }: DroppableTimeSlotProps) {
  const droppableId = `${date.toISOString().split('T')[0]}_${time}`
  
  return (
    <Droppable droppableId={droppableId} isDropDisabled={isOccupied}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            transition-colors duration-200
            ${snapshot.isDraggingOver ? 'task-block-drop-target' : ''}
            ${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

interface DraggableTaskProps {
  task: Task
  index: number
  children: ReactNode
}

export function DraggableTask({ task, index, children }: DraggableTaskProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'task-block-dragging' : ''}
        >
          {children}
        </div>
      )}
    </Draggable>
  )
}
