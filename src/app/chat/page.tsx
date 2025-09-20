import { Suspense } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Skeleton } from '@/components/ui/skeleton'

function ChatSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center py-12">
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto mb-6" />
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-full mb-3" />
            <div className="flex space-x-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatInterface />
    </Suspense>
  )
}
