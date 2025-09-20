import { AuthService } from "@/lib/supabase/auth"

export async function getCurrentUser() {
  return await AuthService.getCurrentUser()
}

export async function getCurrentSession() {
  return await AuthService.getCurrentSession()
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

export async function requireSession() {
  const session = await getCurrentSession()
  
  if (!session) {
    throw new Error('Session required')
  }
  
  return session
}
