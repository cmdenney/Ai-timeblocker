'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/supabase/auth'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser()
        setIsAuthenticated(!!user)
        if (user) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/auth/signin')
    }
  }

  const handleLearnMore = () => {
    // Scroll to features section or navigate to about page
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI TimeBlocker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Intelligent time blocking and calendar management powered by AI. 
            Optimize your schedule, boost productivity, and achieve your goals.
          </p>
        </div>

        <div className="flex gap-4">
          <Button size="lg" className="px-8" onClick={handleGetStarted} disabled={isLoading}>
            {isLoading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
          </Button>
          <Button variant="outline" size="lg" className="px-8" onClick={handleLearnMore}>
            Learn More
          </Button>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                AI-powered time blocking that adapts to your work patterns and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically optimize your calendar based on your energy levels, 
                deadlines, and personal preferences.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>
                Seamlessly sync with Google Calendar, Outlook, and other popular platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep all your calendars in sync while maintaining the flexibility 
                to work with your existing tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Chat Assistant</CardTitle>
              <CardDescription>
                Natural language interface for scheduling and time management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Simply tell the AI what you need to schedule and it will 
                automatically create time blocks and calendar events.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
