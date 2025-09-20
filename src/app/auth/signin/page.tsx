'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Github, Mail, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/supabase/auth'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)
      
      await AuthService.signInWithEmail(email, password)
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`Starting ${provider} OAuth sign-in...`)
      const result = await AuthService.signInWithProvider(provider)
      console.log('OAuth result:', result)
      
      // OAuth will redirect, so no need to navigate manually
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error)
      
      // Check if it's a provider not enabled error
      if (error.message?.includes('provider is not enabled')) {
        setError(`${provider} OAuth is not configured yet. Please use email sign-in or contact support.`)
      } else {
        setError(error.message || `Failed to sign in with ${provider}. Please try again.`)
      }
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
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>
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
