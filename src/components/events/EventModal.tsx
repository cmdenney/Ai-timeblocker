'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit3, 
  Trash2, 
  Copy,
  Save,
  AlertCircle,
  Bell,
  Repeat
} from 'lucide-react'
import { format, addDays, addHours, addMinutes } from 'date-fns'
import { CalendarEvent, EventCategory, EventPriority, EventStatus, EVENT_CATEGORY_COLORS } from '@/types/events'

interface EventModalProps {
  event?: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  onDelete?: (event: CalendarEvent) => void
  onDuplicate?: (event: CalendarEvent) => void
  defaultDate?: Date
  mode?: 'create' | 'edit' | 'view'
}

export function EventModal({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  defaultDate = new Date(),
  mode = 'create'
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    startTime: defaultDate,
    endTime: addHours(defaultDate, 1),
    isAllDay: false,
    category: 'other',
    priority: 'medium',
    status: 'confirmed',
    location: '',
    attendees: [],
    color: '',
    reminders: []
  })

  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        attendees: event.attendees || []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        startTime: defaultDate,
        endTime: addHours(defaultDate, 1),
        isAllDay: false,
        category: 'other',
        priority: 'medium',
        status: 'confirmed',
        location: '',
        attendees: [],
        color: '',
        reminders: []
      })
    }
    setIsEditing(mode === 'create' || mode === 'edit')
  }, [event, defaultDate, mode])

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Handle all-day toggle
  const handleAllDayToggle = (isAllDay: boolean) => {
    const startTime = formData.startTime || new Date()
    const endTime = formData.endTime || addHours(startTime, 1)
    
    setFormData(prev => ({
      ...prev,
      isAllDay,
      startTime: isAllDay ? new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()) : startTime,
      endTime: isAllDay ? new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()) : endTime
    }))
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle save
  const handleSave = () => {
    if (!validateForm()) return
    
    const eventData: CalendarEvent = {
      id: event?.id || `event-${Date.now()}`,
      title: formData.title!,
      description: formData.description || '',
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      isAllDay: formData.isAllDay || false,
      category: formData.category || 'other',
      priority: formData.priority || 'medium',
      status: formData.status || 'confirmed',
      location: formData.location || '',
      attendees: formData.attendees || [],
      color: formData.color || '',
      reminders: formData.reminders || [],
      metadata: formData.metadata || {}
    }
    
    onSave(eventData)
    onClose()
  }

  // Handle delete
  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event)
      onClose()
    }
  }

  // Handle duplicate
  const handleDuplicate = () => {
    if (event && onDuplicate) {
      const duplicatedEvent: CalendarEvent = {
        ...event,
        id: `event-${Date.now()}`,
        title: `${event.title} (Copy)`,
        startTime: addDays(event.startTime, 1),
        endTime: addDays(event.endTime, 1)
      }
      onDuplicate(duplicatedEvent)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${EVENT_CATEGORY_COLORS[formData.category || 'other'].split(' ')[0]}`}></div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create Event' : mode === 'edit' ? 'Edit Event' : 'Event Details'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'view' && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Edit event"
                >
                  <Edit3 className="h-4 w-4 text-gray-600" />
                </button>
                {onDuplicate && (
                  <button
                    onClick={handleDuplicate}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Duplicate event"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-600"
                    aria-label="Delete event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Event title"
                disabled={!isEditing}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event description"
                rows={3}
                disabled={!isEditing}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type={formData.isAllDay ? 'date' : 'datetime-local'}
                  value={formData.startTime ? format(formData.startTime, formData.isAllDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => handleInputChange('startTime', new Date(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!isEditing}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type={formData.isAllDay ? 'date' : 'datetime-local'}
                  value={formData.endTime ? format(formData.endTime, formData.isAllDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => handleInputChange('endTime', new Date(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!isEditing}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.isAllDay || false}
                onChange={(e) => handleAllDayToggle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!isEditing}
              />
              <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                All day
              </label>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category || 'other'}
                  onChange={(e) => handleInputChange('category', e.target.value as EventCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isEditing}
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="important">Important</option>
                  <option value="meeting">Meeting</option>
                  <option value="focus">Focus</option>
                  <option value="break">Break</option>
                  <option value="travel">Travel</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority || 'medium'}
                  onChange={(e) => handleInputChange('priority', e.target.value as EventPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isEditing}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event location"
                disabled={!isEditing}
              />
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendees
              </label>
              <input
                type="text"
                value={(formData.attendees || []).join(', ')}
                onChange={(e) => handleInputChange('attendees', e.target.value.split(',').map(email => email.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email addresses separated by commas"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Create Event' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
