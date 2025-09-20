# Database Setup Guide

This guide will help you set up the PostgreSQL database for AI Timeblocker using Prisma.

## Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL 12 or higher
- npm, yarn, or pnpm

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your database connection:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ai_timeblocker
   ```

3. **Run the setup script:**
   ```bash
   # Windows
   scripts/setup-db.bat
   
   # macOS/Linux
   scripts/setup-db.sh
   ```

## Manual Setup

If you prefer to set up the database manually:

1. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

2. **Push schema to database:**
   ```bash
   npm run db:push
   ```

3. **Seed the database:**
   ```bash
   npm run db:seed
   ```

## Database Schema

The database includes the following models:

### User
- Basic user information (email, name, image)
- Relations to events, chat sessions, calendar connections, and preferences

### Event
- Calendar events with start/end times
- Support for all-day events and recurrence (RRULE)
- External calendar sync (Google, Outlook)
- AI metadata (confidence scores, original prompts)

### ChatSession
- AI chat sessions for user interactions
- Active/inactive status tracking

### ChatMessage
- Individual messages within chat sessions
- Support for user, assistant, and system roles
- JSON metadata for storing parsed events and confidence scores

### CalendarConnection
- External calendar service connections
- OAuth tokens and provider-specific data
- Support for Google, Outlook, and Apple calendars

### UserPreference
- User settings and preferences
- Time zone, time format, working hours
- AI suggestion preferences

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:migrate:deploy` - Deploy migrations to production
- `npm run db:migrate:reset` - Reset database and apply all migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:status` - Check migration status

## API Endpoints

The following API endpoints are available:

### Events
- `GET /api/events` - Get events for a user
- `POST /api/events` - Create a new event
- `PUT /api/events/[id]` - Update an event
- `DELETE /api/events/[id]` - Delete an event

### Chat Sessions
- `GET /api/chat/sessions` - Get chat sessions for a user
- `POST /api/chat/sessions` - Create a new chat session
- `GET /api/chat/sessions/[id]/messages` - Get messages for a session
- `POST /api/chat/sessions/[id]/messages` - Add a message to a session

### User Preferences
- `GET /api/users/[id]/preferences` - Get user preferences
- `PUT /api/users/[id]/preferences` - Update user preferences

### Analytics
- `GET /api/analytics` - Get analytics data (events or chat)

## Database Operations

The `src/lib/db-operations.ts` file contains utility functions for common database operations:

- User management (create, update, get by email)
- Event operations (CRUD, date range queries, search)
- Chat session management
- Calendar connection handling
- User preferences management
- Analytics and statistics

## Development

### Adding New Fields

1. Update the Prisma schema in `prisma/schema.prisma`
2. Run `npm run db:push` to apply changes
3. Update the TypeScript types if needed
4. Update API routes and database operations

### Creating Migrations

For production deployments, use migrations instead of `db:push`:

1. Make changes to the schema
2. Run `npm run db:migrate` to create a migration
3. Review the generated migration file
4. Run `npm run db:migrate:deploy` to apply migrations in production

### Seeding Data

The seed script (`prisma/seed.ts`) creates:
- A demo user with preferences
- Sample calendar events
- A chat session with example messages
- A calendar connection (demo)

You can modify the seed script to add your own test data.

## Troubleshooting

### Common Issues

1. **Connection refused**: Check that PostgreSQL is running and the connection string is correct
2. **Permission denied**: Ensure the database user has proper permissions
3. **Schema drift**: Use `npm run db:push` to sync schema changes
4. **Migration conflicts**: Use `npm run db:migrate:reset` to start fresh (development only)

### Database Connection

Make sure your `DATABASE_URL` follows this format:
```
postgresql://username:password@localhost:5432/database_name
```

For production, consider using connection pooling:
```
postgresql://username:password@localhost:5432/database_name?pgbouncer=true&connection_limit=1
```

## Production Considerations

- Use migrations instead of `db:push` for production
- Set up proper database backups
- Configure connection pooling
- Monitor database performance
- Use environment-specific connection strings
- Implement proper error handling and logging
