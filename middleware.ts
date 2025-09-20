import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { applySecurityMiddleware } from './src/middleware/security'

export async function middleware(request: NextRequest) {
  // Apply security middleware first
  const securityResponse = applySecurityMiddleware(request)
  if (securityResponse) {
    return securityResponse
  }

  // Then apply session middleware
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
