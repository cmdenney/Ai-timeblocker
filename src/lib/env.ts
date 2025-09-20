import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GITHUB_CLIENT_ID: z.string().min(1, 'GitHub Client ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GitHub Client Secret is required'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Google Calendar
  GOOGLE_CALENDAR_API_KEY: z.string().min(1, 'Google Calendar API key is required'),
  GOOGLE_CALENDAR_WEBHOOK_URL: z.string().url('Invalid Google Calendar webhook URL').optional(),
  
  // Application
  NEXT_PUBLIC_BASE_URL: z.string().url('Invalid base URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Environment check utility
export function isDevelopment() {
  return env.NODE_ENV === 'development'
}

export function isProduction() {
  return env.NODE_ENV === 'production'
}

export function isTest() {
  return env.NODE_ENV === 'test'
}

// Log environment status (only in development)
if (isDevelopment()) {
  console.log('🔧 Environment Status:')
  console.log(`  - Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`)
  console.log(`  - NextAuth Secret: ${env.NEXTAUTH_SECRET ? '✅' : '❌'}`)
  console.log(`  - Google OAuth: ${env.GOOGLE_CLIENT_ID ? '✅' : '❌'}`)
  console.log(`  - GitHub OAuth: ${env.GITHUB_CLIENT_ID ? '✅' : '❌'}`)
  console.log(`  - OpenAI API: ${env.OPENAI_API_KEY ? '✅' : '❌'}`)
  console.log(`  - Google Calendar: ${env.GOOGLE_CALENDAR_API_KEY ? '✅' : '❌'}`)
}
