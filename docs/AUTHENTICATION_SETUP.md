# Authentication Setup Guide

This guide covers the complete NextAuth.js v5 (Auth.js) authentication setup for AI Timeblocker.

## Overview

The authentication system includes:
- OAuth providers (Google, GitHub)
- JWT-based sessions
- Protected routes with middleware
- User profile management
- Database integration with Prisma

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```

3. **Configure OAuth providers:**
   - Google OAuth (for calendar access)
   - GitHub OAuth

4. **Run the application:**
   ```bash
   npm run dev
   ```

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

6. Update `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)

4. Update `.env.local`:
   ```env
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

## Environment Variables

Required environment variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_timeblocker
```

## Authentication Flow

### 1. Sign In Process

1. User clicks "Sign In" button
2. Redirected to OAuth provider (Google/GitHub)
3. User authorizes the application
4. OAuth provider redirects back with authorization code
5. NextAuth exchanges code for access token
6. User information is fetched and stored in session
7. User is redirected to dashboard

### 2. Session Management

- Sessions are stored as JWTs
- Session duration: 30 days
- Automatic refresh before expiration
- Access tokens stored in JWT for API calls

### 3. Protected Routes

- Middleware protects routes starting with `/dashboard`, `/settings`, `/calendar`, `/analytics`, `/profile`
- Unauthenticated users are redirected to sign-in page
- Authenticated users are redirected away from auth pages

## File Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts                 # NextAuth API routes
│   ├── auth/
│   │   ├── signin/page.tsx         # Sign-in page
│   │   └── error/page.tsx          # Auth error page
│   └── profile/
│       └── page.tsx                # User profile page
├── components/
│   ├── auth/
│   │   ├── sign-in-form.tsx        # Sign-in form component
│   │   ├── sign-out-button.tsx     # Sign-out button with dropdown
│   │   └── auth-guard.tsx          # Client-side auth guard
│   ├── navigation/
│   │   └── main-nav.tsx            # Main navigation with auth
│   └── profile/
│       └── profile-form.tsx        # Profile management form
├── lib/
│   └── auth.ts                     # Auth utilities and helpers
└── types/
    └── next-auth.d.ts             # NextAuth TypeScript types
```

## API Endpoints

### Authentication Routes

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js API routes
- `GET /api/auth/signin` - Sign-in page
- `GET /api/auth/signout` - Sign-out endpoint
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - CSRF token

### User Management

- `PUT /api/users/[id]` - Update user profile
- `PUT /api/users/[id]/preferences` - Update user preferences

## Components

### SignInForm

```tsx
import { SignInForm } from '@/components/auth/sign-in-form'

<SignInForm callbackUrl="/dashboard" />
```

Features:
- OAuth provider buttons (Google, GitHub)
- Error handling and loading states
- Responsive design
- Terms and privacy policy links

### SignOutButton

```tsx
import { SignOutButton } from '@/components/auth/sign-out-button'

<SignOutButton user={session.user} />
```

Features:
- User avatar with dropdown menu
- Profile and settings links
- Sign-out functionality
- Loading states

### AuthGuard

```tsx
import { AuthGuard } from '@/components/auth/auth-guard'

<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

Features:
- Client-side route protection
- Automatic redirect to sign-in
- Loading states
- Custom fallback components

## Server-Side Authentication

### Get Current User

```tsx
import { getCurrentUser } from '@/lib/auth'

export default async function Page() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Please sign in</div>
  }
  
  return <div>Welcome, {user.name}!</div>
}
```

### Require Authentication

```tsx
import { requireAuth } from '@/lib/auth'

export default async function Page() {
  const user = await requireAuth() // Throws if not authenticated
  
  return <div>Welcome, {user.name}!</div>
}
```

## Client-Side Authentication

### Use Session Hook

```tsx
import { useSession } from 'next-auth/react'

export default function Component() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Please sign in</div>
  
  return <div>Welcome, {session.user.name}!</div>
}
```

### Sign In/Out

```tsx
import { signIn, signOut } from 'next-auth/react'

// Sign in
await signIn('google', { callbackUrl: '/dashboard' })

// Sign out
await signOut({ callbackUrl: '/' })
```

## Database Integration

### User Creation

Users are automatically created in the database on first sign-in:

```tsx
// In auth callbacks
const user = await getUserByEmail(session.user.email)

if (!user) {
  user = await createUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  })
}
```

### User Profile Management

```tsx
// Update user profile
const response = await fetch(`/api/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Name' })
})
```

## Security Features

### CSRF Protection

NextAuth.js automatically handles CSRF protection for all authentication requests.

### JWT Security

- JWTs are signed with `NEXTAUTH_SECRET`
- Tokens include user information and access tokens
- Automatic token refresh before expiration

### Route Protection

- Middleware protects sensitive routes
- Server-side authentication checks
- Client-side auth guards for better UX

### OAuth Scopes

Google OAuth includes calendar access:
```tsx
authorization: {
  params: {
    scope: "openid email profile https://www.googleapis.com/auth/calendar"
  }
}
```

## Error Handling

### Auth Error Page

Located at `/auth/error`, handles various authentication errors:
- Configuration errors
- Access denied
- Verification errors
- OAuth provider errors

### Error Messages

```tsx
const errorMessages = {
  Configuration: 'Server configuration problem',
  AccessDenied: 'Access denied',
  Verification: 'Verification token expired',
  Default: 'Authentication error occurred'
}
```

## Customization

### Custom Sign-In Page

```tsx
// In auth.config.ts
pages: {
  signIn: '/auth/signin',
  error: '/auth/error'
}
```

### Custom Callbacks

```tsx
// In auth.config.ts
callbacks: {
  async signIn({ user, account, profile }) {
    // Custom sign-in logic
    return true
  },
  async jwt({ token, account, user }) {
    // Custom JWT handling
    return token
  },
  async session({ session, token }) {
    // Custom session handling
    return session
  }
}
```

## Troubleshooting

### Common Issues

1. **"Configuration" error**: Check environment variables
2. **"AccessDenied" error**: OAuth app not configured correctly
3. **Session not persisting**: Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
4. **Redirect loops**: Check middleware configuration

### Debug Mode

Enable NextAuth debug mode:

```env
NEXTAUTH_DEBUG=true
```

### Logs

Check browser console and server logs for authentication errors.

## Production Deployment

### Environment Variables

Set all required environment variables in your production environment.

### OAuth Redirect URIs

Update OAuth provider settings with production URLs:
- `https://yourdomain.com/api/auth/callback/google`
- `https://yourdomain.com/api/auth/callback/github`

### Database

Ensure database is accessible from production environment.

### Security

- Use strong `NEXTAUTH_SECRET`
- Enable HTTPS in production
- Configure proper CORS settings
- Monitor authentication logs

## Testing

### Unit Tests

Test authentication utilities and components:

```tsx
import { render, screen } from '@testing-library/react'
import { SignInForm } from '@/components/auth/sign-in-form'

test('renders sign-in form', () => {
  render(<SignInForm />)
  expect(screen.getByText('Continue with Google')).toBeInTheDocument()
})
```

### Integration Tests

Test authentication flow with OAuth providers using test credentials.

## Support

For issues and questions:
- Check NextAuth.js documentation
- Review error logs
- Test with minimal configuration
- Verify OAuth provider settings
