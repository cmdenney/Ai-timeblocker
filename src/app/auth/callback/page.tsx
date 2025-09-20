'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/lib/supabase/auth'
import { UserService } from '@/lib/supabase/services/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get the current session after OAuth redirect
        const session = await AuthService.getCurrentSession()
        
        if (!session) {
          throw new Error('No session found')
        }

        if (!session.user) {
          throw new Error('No user found in session')
        }

        // Ensure user profile exists in our database
        try {
          await UserService.getOrCreateUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          })
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError)
          // Don't throw here, just log the error
        }

        // Redirect to dashboard
        router.push('/dashboard')
      } catch (error: any) {
        console.error('Auth callback error:', error)
        setError(error.message || 'Authentication failed')
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Completing Sign In</CardTitle>
            <CardDescription>
              Please wait while we complete your authentication...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <CardDescription>
              Something went wrong during the sign-in process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/auth/signin')}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 border border-border px-4 py-2 rounded-md hover:bg-accent"
              >
                Go Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
