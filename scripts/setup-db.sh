#!/bin/bash

# Database setup script for AI Timeblocker
echo "🚀 Setting up AI Timeblocker database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env.local file"
    echo "Example: DATABASE_URL=postgresql://username:password@localhost:5432/ai_timeblocker"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npm run db:generate

# Push schema to database
echo "🗄️  Pushing schema to database..."
npm run db:push

# Run seed data
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Database setup completed successfully!"
echo ""
echo "You can now:"
echo "  - Run 'npm run dev' to start the development server"
echo "  - Run 'npm run db:studio' to open Prisma Studio"
echo "  - Run 'npm run db:migrate' to create migrations"
