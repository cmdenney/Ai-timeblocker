'use client'

import { useState } from 'react'
import { AuthService } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Github, Mail, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SignInFormProps {
  callbackUrl?: string
}

export function SignInForm({ callbackUrl = '/dashboard' }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use Supabase Auth for OAuth
      await AuthService.signInWithProvider(provider)
      
      // The redirect will be handled by Supabase Auth
      // User will be redirected to /auth/callback after OAuth
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to AI TimeBlocker</CardTitle>
          <CardDescription>
            Sign in to your account to get started with intelligent time management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <Button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our{' '}
              <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              New to AI TimeBlocker?{' '}
              <a href="/auth/signup" className="underline underline-offset-4 hover:text-primary">
                Create an account
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
