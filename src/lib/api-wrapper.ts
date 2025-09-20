import { NextRequest, NextResponse } from 'next/server'
import { log } from './logger'
import { z } from 'zod'

// API Error types
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Common API errors
export const APIErrors = {
  UNAUTHORIZED: (message = 'Unauthorized') => new APIError(401, message, 'UNAUTHORIZED'),
  FORBIDDEN: (message = 'Forbidden') => new APIError(403, message, 'FORBIDDEN'),
  NOT_FOUND: (message = 'Not found') => new APIError(404, message, 'NOT_FOUND'),
  VALIDATION_ERROR: (message = 'Validation error', details?: Record<string, any>) => 
    new APIError(400, message, 'VALIDATION_ERROR', details),
  INTERNAL_ERROR: (message = 'Internal server error') => new APIError(500, message, 'INTERNAL_ERROR'),
  SERVICE_UNAVAILABLE: (message = 'Service unavailable') => new APIError(503, message, 'SERVICE_UNAVAILABLE'),
  RATE_LIMITED: (message = 'Rate limited') => new APIError(429, message, 'RATE_LIMITED'),
  BAD_GATEWAY: (message = 'Bad gateway') => new APIError(502, message, 'BAD_GATEWAY'),
}

// Request validation schema
const RequestValidationSchema = z.object({
  method: z.string(),
  url: z.string(),
  headers: z.record(z.string()),
  body: z.any().optional(),
})

// API wrapper function
export function withErrorHandling<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  options: {
    requireAuth?: boolean
    validateBody?: z.ZodSchema
    rateLimit?: {
      maxRequests: number
      windowMs: number
    }
    logging?: boolean
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    const userId = request.headers.get('x-user-id') || undefined
    
    try {
      // Log request
      if (options.logging !== false) {
        log.api.request(request.method, request.url, { userId, requestId })
      }

      // Validate request
      const validationResult = RequestValidationSchema.safeParse({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body
      })

      if (!validationResult.success) {
        throw APIErrors.VALIDATION_ERROR('Invalid request format', validationResult.error.errors)
      }

      // Rate limiting (basic implementation)
      if (options.rateLimit) {
        // TODO: Implement proper rate limiting with Redis or similar
        // For now, we'll just log the request
        log.debug('Rate limiting check', { rateLimit: options.rateLimit }, { userId, requestId })
      }

      // Authentication check
      if (options.requireAuth) {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
          throw APIErrors.UNAUTHORIZED('Authentication required')
        }
        // TODO: Implement proper JWT validation
      }

      // Body validation
      if (options.validateBody && request.method !== 'GET') {
        try {
          const body = await request.json()
          const validatedBody = options.validateBody.parse(body)
          // Replace request body with validated data
          request = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(validatedBody)
          })
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw APIErrors.VALIDATION_ERROR('Invalid request body', error.errors)
          }
          throw error
        }
      }

      // Execute handler
      const response = await handler(request, context)
      const duration = Date.now() - startTime

      // Log response
      if (options.logging !== false) {
        log.api.response(request.method, request.url, response.status, duration, { userId, requestId })
      }

      return response

    } catch (error) {
      const duration = Date.now() - startTime
      
      // Log error
      log.error(`API Error: ${request.method} ${request.url}`, error as Error, { 
        method: request.method, 
        url: request.url, 
        duration 
      }, { userId, requestId })

      // Handle different error types
      if (error instanceof APIError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
              requestId
            }
          },
          { status: error.statusCode }
        )
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: error.errors,
              requestId
            }
          },
          { status: 400 }
        )
      }

      // Handle unexpected errors
      const isDevelopment = process.env.NODE_ENV === 'development'
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: isDevelopment ? (error as Error).message : 'Internal server error',
            details: isDevelopment ? { stack: (error as Error).stack } : undefined,
            requestId
          }
        },
        { status: 500 }
      )
    }
  }
}

// Utility function for common API responses
export function createAPIResponse<T = any>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, { status, headers })
}

// Utility function for error responses
export function createErrorResponse(
  error: APIError,
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId
      }
    },
    { status: error.statusCode }
  )
}

// Utility function for validation errors
export function createValidationErrorResponse(
  errors: z.ZodError['errors'],
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
        requestId
      }
    },
    { status: 400 }
  )
}

// Utility function for success responses
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status }
  )
}

// Health check endpoint
export function createHealthCheckResponse(): NextResponse {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
}

// Database error handler
export function handleDatabaseError(error: any, operation: string, table: string): APIError {
  log.error(`Database error during ${operation} on ${table}`, error)
  
  if (error.code === 'P2002') {
    return APIErrors.VALIDATION_ERROR('Duplicate entry', { field: error.meta?.target })
  }
  
  if (error.code === 'P2025') {
    return APIErrors.NOT_FOUND('Record not found')
  }
  
  if (error.code === 'P2003') {
    return APIErrors.VALIDATION_ERROR('Foreign key constraint failed')
  }
  
  return APIErrors.INTERNAL_ERROR('Database operation failed')
}

// External API error handler
export function handleExternalAPIError(error: any, service: string, operation: string): APIError {
  log.error(`External API error from ${service} during ${operation}`, error)
  
  if (error.status === 401) {
    return APIErrors.UNAUTHORIZED(`${service} authentication failed`)
  }
  
  if (error.status === 403) {
    return APIErrors.FORBIDDEN(`${service} access denied`)
  }
  
  if (error.status === 404) {
    return APIErrors.NOT_FOUND(`${service} resource not found`)
  }
  
  if (error.status === 429) {
    return APIErrors.RATE_LIMITED(`${service} rate limit exceeded`)
  }
  
  if (error.status >= 500) {
    return APIErrors.SERVICE_UNAVAILABLE(`${service} is temporarily unavailable`)
  }
  
  return APIErrors.INTERNAL_ERROR(`${service} operation failed`)
}
