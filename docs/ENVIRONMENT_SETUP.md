# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database Configuration
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_timeblocker
```

### NextAuth.js Configuration
```bash
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### Google OAuth Configuration
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### GitHub OAuth Configuration
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### OpenAI Configuration
```bash
OPENAI_API_KEY=your_openai_api_key
```

### Google Calendar API Configuration
```bash
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
GOOGLE_CALENDAR_WEBHOOK_URL=https://your-domain.com/api/calendar/webhook
```

### Application Configuration
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > API > Service Role to get your service role key
4. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API and Google Calendar API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 3. GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 4. OpenAI Setup
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key in the API Keys section

### 5. Google Calendar API Setup
1. In Google Cloud Console, enable Google Calendar API
2. Create credentials for Google Calendar API
3. Set up webhook notifications (optional for real-time sync)

## Quick Start

1. Copy the environment variables above to `.env.local`
2. Fill in your actual values for each service
3. Run `npm run dev` to start the development server
4. Visit `http://localhost:3000` to see the application

## Troubleshooting

### Common Issues

1. **"supabaseUrl is required" error**: Make sure `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local`
2. **Authentication not working**: Verify OAuth client IDs and secrets are correct
3. **Database errors**: Ensure Supabase project is set up and schema is applied
4. **OpenAI errors**: Check that `OPENAI_API_KEY` is valid and has credits

### Development vs Production

- For development: Use `http://localhost:3000` for all URLs
- For production: Update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your domain
- Update OAuth redirect URIs to include your production domain
