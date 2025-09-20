import { supabase } from './client'
import { UserService } from './services/users'
import { Database } from './database.types'
import { User as SupabaseUser } from '@supabase/supabase-js'

type User = Database['public']['Tables']['users']['Row']

export interface AuthenticatedUser {
  id: string
  email: string
  profile: User | null
  // Include other Supabase user properties as needed
  app_metadata: any
  user_metadata: any
  aud: string
  created_at?: string
  updated_at?: string
  confirmation_sent_at?: string
  recovery_sent_at?: string
  email_confirmed_at?: string
  invited_at?: string
  action_link?: string
  email_change_sent_at?: string
  new_email?: string
  new_phone?: string
  phone?: string
  phone_confirmed_at?: string
  phone_change_sent_at?: string
  confirmed_at?: string
  email_change_confirm_status?: number
  banned_until?: string
  is_sso_user?: boolean
  deleted_at?: string
  is_anonymous?: boolean
}

export class AuthService {
  // Get current user from Supabase auth
  static async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    try {
      // Get user profile from our users table
      const profile = await UserService.getUser(user.id)
      return {
        ...user,
        profile
      } as AuthenticatedUser
    } catch (error) {
      // User exists in auth but not in our users table
      // This shouldn't happen with proper auth flow, but handle gracefully
      console.error('User profile not found:', error)
      return {
        ...user,
        profile: null
      } as AuthenticatedUser
    }
  }

  // Get current session
  static async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    return session
  }

  // Sign in with email and password
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`)
    }

    // Ensure user profile exists
    if (data.user) {
      try {
        await UserService.getOrCreateUser({
          id: data.user.id,
          email: data.user.email || '',
          user_metadata: data.user.user_metadata,
        })
      } catch (error) {
        console.error('Failed to get or create user profile:', error)
      }
    }

    return data
  }

  // Sign up with email and password
  static async signUpWithEmail(email: string, password: string, metadata?: {
    full_name?: string
    avatar_url?: string
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`)
    }

    // Create user profile
    if (data.user) {
      try {
        await UserService.createUser({
          email: data.user.email!,
          full_name: metadata?.full_name || null,
          avatar_url: metadata?.avatar_url || null,
          timezone: 'UTC',
          working_hours: {
            start: 9,
            end: 17,
            days: [1, 2, 3, 4, 5] // Monday to Friday
          },
          preferences: {
            theme: 'light',
            notifications: true,
            emailReminders: true
          }
        })
      } catch (error) {
        console.error('Failed to create user profile:', error)
      }
    }

    return data
  }

  // Sign in with OAuth provider
  static async signInWithProvider(provider: 'google' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw new Error(`OAuth sign in failed: ${error.message}`)
    }

    return data
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }

    return true
  }

  // Reset password
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`)
    }

    return true
  }

  // Update password
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(`Password update failed: ${error.message}`)
    }

    return true
  }

  // Update user profile
  static async updateProfile(updates: {
    full_name?: string
    avatar_url?: string
    timezone?: string
    working_hours?: any
    preferences?: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    return UserService.updateUser(user.id, updates)
  }

  // Get user session
  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw new Error(`Failed to get session: ${error.message}`)
    }

    return session
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  }

  // Get user profile
  static async getUserProfile(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    try {
      return await UserService.getUser(user.id)
    } catch (error) {
      console.error('Failed to get user profile:', error)
      return null
    }
  }

  // Refresh session
  static async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      throw new Error(`Session refresh failed: ${error.message}`)
    }

    return data
  }

  // Get user metadata
  static async getUserMetadata() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    return user.user_metadata
  }

  // Update user metadata
  static async updateUserMetadata(metadata: any) {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    })

    if (error) {
      throw new Error(`Metadata update failed: ${error.message}`)
    }

    return true
  }
}
