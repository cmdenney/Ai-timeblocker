'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  Reply,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { ParsedEvent } from '@/lib/openai'

interface MessageThread {
  id: string
  parentId?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  isCollapsed: boolean
  metadata?: {
    title?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
  }
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    parsedEvents?: ParsedEvent[]
    confidence?: number
    suggestions?: string[]
    conflicts?: Array<{
      type: string
      description: string
      severity: string
    }>
  }
  replies?: ChatMessage[]
}

interface MessageThreadProps {
  thread: MessageThread
  onReply: (parentId: string, content: string) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onToggleCollapse: (threadId: string) => void
  onAddTag: (threadId: string, tag: string) => void
  onRemoveTag: (threadId: string, tag: string) => void
}

export function MessageThread({
  thread,
  onReply,
  onEdit,
  onDelete,
  onToggleCollapse,
  onAddTag,
  onRemoveTag
}: MessageThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(thread.id, replyContent)
      setReplyContent('')
      setIsReplying(false)
    }
  }

  const handleEdit = (messageId: string, currentContent: string) => {
    setEditingMessage(messageId)
    setEditContent(currentContent)
  }

  const handleSaveEdit = () => {
    if (editingMessage && editContent.trim()) {
      onEdit(editingMessage, editContent)
      setEditingMessage(null)
      setEditContent('')
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleAddTag = () => {
    const tag = prompt('Enter tag name:')
    if (tag && tag.trim()) {
      onAddTag(thread.id, tag.trim())
    }
  }

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleCollapse(thread.id)}
              className="p-1"
            >
              {thread.isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <div>
              <h3 className="font-medium text-gray-900">
                {thread.metadata?.title || `Thread ${thread.id.slice(-6)}`}
              </h3>
              <p className="text-sm text-gray-500">
                {thread.messages.length} messages • 
                {format(thread.updatedAt, 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Tags */}
            <div className="flex space-x-1">
              {thread.metadata?.tags?.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  onClick={() => onRemoveTag(thread.id, tag)}
                >
                  {tag} ×
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddTag}
                className="text-xs"
              >
                + Add Tag
              </Button>
            </div>

            {/* Priority Badge */}
            {thread.metadata?.priority && (
              <Badge
                variant={
                  thread.metadata.priority === 'high' 
                    ? 'destructive' 
                    : thread.metadata.priority === 'medium' 
                    ? 'default' 
                    : 'secondary'
                }
                className="text-xs"
              >
                {thread.metadata.priority}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {!thread.isCollapsed && (
        <div className="p-4 space-y-4">
          {thread.messages.map((message) => (
            <div key={message.id} className="relative group">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                  {message.role === 'user' ? 'U' : 'A'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(message.timestamp, 'h:mm a')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md resize-none"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingMessage(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>

                  {/* Message Metadata */}
                  {message.metadata && (
                    <div className="mt-2 space-y-2">
                      {/* Parsed Events */}
                      {message.metadata.parsedEvents && message.metadata.parsedEvents.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="text-xs font-medium text-green-800 mb-2">
                            📅 Parsed Events ({message.metadata.parsedEvents.length})
                          </div>
                          <div className="space-y-2">
                            {message.metadata.parsedEvents.map((event, index) => (
                              <div key={index} className="text-xs text-green-700">
                                <div className="font-medium">{event.title}</div>
                                <div>
                                  {format(new Date(event.startDate), 'MMM d, h:mm a')} - 
                                  {format(new Date(event.endDate), 'h:mm a')}
                                </div>
                                {event.location && (
                                  <div className="text-gray-600">📍 {event.location}</div>
                                )}
                                {event.confidence && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs mt-1"
                                  >
                                    {Math.round(event.confidence * 100)}% confidence
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.metadata.suggestions && message.metadata.suggestions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="text-xs font-medium text-blue-800 mb-2">
                            💡 Suggestions
                          </div>
                          <ul className="text-xs text-blue-700 space-y-1">
                            {message.metadata.suggestions.map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Conflicts */}
                      {message.metadata.conflicts && message.metadata.conflicts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="text-xs font-medium text-red-800 mb-2">
                            ⚠️ Conflicts Detected
                          </div>
                          <div className="space-y-1">
                            {message.metadata.conflicts.map((conflict, index) => (
                              <div key={index} className="text-xs text-red-700">
                                <div className="font-medium capitalize">
                                  {conflict.type.replace('_', ' ')}
                                </div>
                                <div>{conflict.description}</div>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs mt-1"
                                >
                                  {conflict.severity} severity
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Actions */}
                  <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyMessage(message.content)}
                      className="text-xs h-6 px-2"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    {message.role === 'user' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(message.id, message.content)}
                          className="text-xs h-6 px-2"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(message.id)}
                          className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Add a reply to this thread..."
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleReply}>
                    Reply
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsReplying(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Thread management utilities
export function createMessageThread(
  id: string,
  messages: ChatMessage[],
  metadata?: {
    title?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
  }
): MessageThread {
  return {
    id,
    messages,
    createdAt: new Date(),
    updatedAt: new Date(),
    isCollapsed: false,
    metadata
  }
}

export function addMessageToThread(
  thread: MessageThread,
  message: ChatMessage
): MessageThread {
  return {
    ...thread,
    messages: [...thread.messages, message],
    updatedAt: new Date()
  }
}

export function updateThreadMetadata(
  thread: MessageThread,
  metadata: Partial<MessageThread['metadata']>
): MessageThread {
  return {
    ...thread,
    metadata: { ...thread.metadata, ...metadata },
    updatedAt: new Date()
  }
}
