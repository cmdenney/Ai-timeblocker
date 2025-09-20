# Supabase Database Setup Guide

This guide covers setting up Supabase as the database for the AI Timeblocker project, including database schema, authentication, and service integration.

## Overview

Supabase provides:
- **PostgreSQL Database** with real-time subscriptions
- **Authentication** with multiple providers
- **Row Level Security (RLS)** for data protection
- **Auto-generated APIs** for database operations
- **Real-time subscriptions** for live updates

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `ai-timeblocker`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Key** (public key for client-side)
   - **Service Role Key** (secret key for server-side)

### 3. Update Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. Verify all tables and policies are created

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  working_hours JSONB DEFAULT '{"start": 9, "end": 17, "days": [1,2,3,4,5]}',
  preferences JSONB DEFAULT '{"theme": "light", "notifications": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Calendar Events Table
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  category event_category DEFAULT 'other',
  priority event_priority DEFAULT 'medium',
  color TEXT,
  recurrence_rule TEXT,
  recurrence_pattern TEXT,
  attendees JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);
```

#### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Custom Types

```sql
CREATE TYPE event_category AS ENUM ('work', 'personal', 'meeting', 'break', 'focus', 'other');
CREATE TYPE event_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
```

### Indexes for Performance

```sql
-- Calendar events indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_user_start ON calendar_events(user_id, start_time);

-- Chat sessions indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
```

## Row Level Security (RLS)

### Enable RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

### User Policies
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Calendar Events Policies
```sql
-- Users can view own events
CREATE POLICY "Users can view own events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own events
CREATE POLICY "Users can insert own events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own events
CREATE POLICY "Users can update own events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own events
CREATE POLICY "Users can delete own events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);
```

### Chat Policies
```sql
-- Users can view own chat sessions
CREATE POLICY "Users can view own sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view own messages
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );
```

## Authentication Setup

### 1. Configure Auth Providers

Go to **Authentication** → **Providers** in your Supabase dashboard:

#### Email/Password
- Enable **Email** provider
- Configure email templates
- Set up email confirmation

#### Google OAuth
- Enable **Google** provider
- Add Google OAuth credentials:
  - **Client ID**: From Google Cloud Console
  - **Client Secret**: From Google Cloud Console
- Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### GitHub OAuth
- Enable **GitHub** provider
- Add GitHub OAuth credentials:
  - **Client ID**: From GitHub OAuth App
  - **Client Secret**: From GitHub OAuth App
- Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 2. Configure Auth Settings

Go to **Authentication** → **Settings**:

- **Site URL**: `http://localhost:3000` (development)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback`
- **JWT Expiry**: 3600 seconds (1 hour)
- **Refresh Token Rotation**: Enabled

## Service Integration

### 1. Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### 2. Server-Side Client

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle error
          }
        },
      },
    }
  )
}
```

### 3. Middleware Integration

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

## Service Layer

### Event Service

```typescript
// src/lib/supabase/services/events.ts
import { supabase } from '../client'

export class EventService {
  static async getEvents(userId: string, options?: {
    startDate?: Date
    endDate?: Date
    category?: string
  }) {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    if (options?.startDate) {
      query = query.gte('start_time', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('start_time', options.endDate.toISOString())
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data || []
  }

  static async createEvent(event: any) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(event)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }

    return data
  }

  // ... other methods
}
```

### Chat Service

```typescript
// src/lib/supabase/services/chat.ts
import { supabase } from '../client'

export class ChatService {
  static async getSessions(userId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data || []
  }

  static async createSession(session: any) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(session)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  // ... other methods
}
```

## Real-time Subscriptions

### Subscribe to Events

```typescript
import { supabase } from '@/lib/supabase/client'

// Subscribe to calendar events
const subscription = supabase
  .channel('calendar_events')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'calendar_events',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Event changed:', payload)
    // Update UI
  })
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

### Subscribe to Chat Messages

```typescript
// Subscribe to chat messages
const subscription = supabase
  .channel('chat_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    console.log('New message:', payload)
    // Update chat UI
  })
  .subscribe()
```

## Database Functions

### User Dashboard Data

```sql
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user', (SELECT row_to_json(u) FROM users u WHERE u.id = user_uuid),
    'stats', (
      SELECT json_build_object(
        'total_events', COUNT(ce.id),
        'total_sessions', COUNT(cs.id),
        'total_messages', COUNT(cm.id),
        'events_this_week', COUNT(CASE WHEN ce.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)
      )
      FROM users u
      LEFT JOIN calendar_events ce ON u.id = ce.user_id
      LEFT JOIN chat_sessions cs ON u.id = cs.user_id
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE u.id = user_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing

### 1. Test Database Connection

```typescript
// test-db-connection.ts
import { supabase } from './src/lib/supabase/client'

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection failed:', error)
    } else {
      console.log('Database connection successful')
    }
  } catch (error) {
    console.error('Connection test failed:', error)
  }
}

testConnection()
```

### 2. Test Authentication

```typescript
// test-auth.ts
import { supabase } from './src/lib/supabase/client'

async function testAuth() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })

    if (error) {
      console.error('Auth test failed:', error)
    } else {
      console.log('Auth test successful:', data.user)
    }
  } catch (error) {
    console.error('Auth test failed:', error)
  }
}

testAuth()
```

## Deployment

### 1. Production Environment

Update your production environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### 2. Database Migrations

For production deployments, use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Backup Strategy

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Manual Backups**: Use Supabase dashboard or CLI
3. **Point-in-Time Recovery**: Available for Pro plans

## Monitoring and Analytics

### 1. Database Performance

- Monitor query performance in **Database** → **Logs**
- Use **Database** → **Indexes** to optimize queries
- Check **Database** → **Reports** for usage statistics

### 2. Authentication Analytics

- View user signups in **Authentication** → **Users**
- Monitor failed logins in **Authentication** → **Logs**
- Track OAuth providers in **Authentication** → **Providers**

### 3. Real-time Monitoring

- Monitor subscriptions in **Realtime** → **Logs**
- Check connection counts in **Realtime** → **Status**

## Security Best Practices

### 1. Row Level Security

- Always enable RLS on sensitive tables
- Test policies thoroughly
- Use `auth.uid()` for user-specific data

### 2. API Keys

- Never expose service role key in client code
- Use anon key for client-side operations
- Rotate keys regularly

### 3. Database Security

- Use strong passwords
- Enable SSL connections
- Regular security updates

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check environment variables
   - Verify project URL and keys
   - Check network connectivity

2. **Authentication Issues**
   - Verify OAuth provider settings
   - Check redirect URLs
   - Review auth policies

3. **RLS Policy Issues**
   - Test policies in SQL editor
   - Check user context
   - Verify policy conditions

### Debug Tools

1. **Supabase Dashboard**
   - SQL Editor for testing queries
   - Logs for debugging issues
   - API documentation

2. **Browser DevTools**
   - Network tab for API calls
   - Console for client errors
   - Application tab for storage

3. **Supabase CLI**
   - Local development setup
   - Database migrations
   - Type generation

## Support

- **Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Support**: [supabase.com/support](https://supabase.com/support)
