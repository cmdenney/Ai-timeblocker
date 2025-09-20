import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

// Security middleware for additional protection
export function securityMiddleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'

  // Log suspicious activity
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /on\w+\s*=/i,  // Event handler injection
  ]

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(pathname) || pattern.test(searchParams.toString())
  )

  if (isSuspicious) {
    log.warn('Suspicious request detected', {
      pathname,
      searchParams: searchParams.toString(),
      userAgent,
      ip
    })
    
    return NextResponse.json(
      { error: 'Bad Request' },
      { status: 400 }
    )
  }

  // Rate limiting headers
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

// Bot detection and blocking
export function botDetectionMiddleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname

  // Known bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i,
  ]

  const isBot = botPatterns.some(pattern => pattern.test(userAgent))

  // Block bots from sensitive endpoints
  const sensitiveEndpoints = [
    '/api/auth',
    '/api/users',
    '/api/calendar',
    '/api/chat',
  ]

  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
    pathname.startsWith(endpoint)
  )

  if (isBot && isSensitiveEndpoint) {
    log.warn('Bot blocked from sensitive endpoint', {
      userAgent,
      pathname
    })
    
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }

  return null
}

// Request size limiting
export function requestSizeMiddleware(request: NextRequest) {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (size > maxSize) {
      log.warn('Request too large', {
        size,
        maxSize,
        pathname: request.nextUrl.pathname
      })
      
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      )
    }
  }

  return null
}

// IP-based rate limiting (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100 // 100 requests per window

  const current = rateLimitMap.get(ip)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return null
  }

  if (current.count >= maxRequests) {
    log.warn('Rate limit exceeded', { ip, count: current.count })
    
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  current.count++
  return null
}

// Main security middleware
export function applySecurityMiddleware(request: NextRequest) {
  // Apply all security checks
  const checks = [
    securityMiddleware,
    botDetectionMiddleware,
    requestSizeMiddleware,
    rateLimitMiddleware,
  ]

  for (const check of checks) {
    const result = check(request)
    if (result) {
      return result
    }
  }

  return null
}
