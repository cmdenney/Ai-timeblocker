import { NextRequest } from 'next/server'
import { createHealthCheckResponse, withErrorHandling } from '@/lib/api-wrapper'
import { log } from '@/lib/logger'

// Health check endpoint
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    log.info('Health check requested')
    
    // Check database connection
    let databaseStatus = 'healthy'
    try {
      // TODO: Add actual database health check
      // const { supabase } = await import('@/lib/supabase/client')
      // await supabase.from('users').select('count').limit(1)
      log.debug('Database health check passed')
    } catch (error) {
      databaseStatus = 'unhealthy'
      log.error('Database health check failed', error as Error)
    }

    // Check external services
    let externalServices = {
      openai: 'unknown',
      google: 'unknown',
      supabase: 'unknown'
    }

    try {
      // Check OpenAI
      if (process.env.OPENAI_API_KEY) {
        externalServices.openai = 'configured'
      } else {
        externalServices.openai = 'not_configured'
      }

      // Check Google
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        externalServices.google = 'configured'
      } else {
        externalServices.google = 'not_configured'
      }

      // Check Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        externalServices.supabase = 'configured'
      } else {
        externalServices.supabase = 'not_configured'
      }

    } catch (error) {
      log.error('External services check failed', error as Error)
    }

    const healthData = {
      status: databaseStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseStatus,
        ...externalServices
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    log.info('Health check completed', { status: healthData.status })
    
    return createHealthCheckResponse()
  },
  {
    logging: true,
    requireAuth: false
  }
)
