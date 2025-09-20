// Build-time environment validation
// This file is only used during build to ensure required environment variables are present

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY'
]

// Check if we're in build mode
const isBuildMode = process.env.NODE_ENV === 'production' || process.argv.includes('build')

if (isBuildMode) {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables for build:')
    missingVars.forEach(varName => {
      console.warn(`   - ${varName}`)
    })
    console.warn('   These will need to be set in your deployment environment.')
  } else {
    console.log('✅ All required environment variables are present for build')
  }
}

// Export a function to check environment variables
export function validateBuildEnv() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  return {
    isValid: missingVars.length === 0,
    missingVars
  }
}
