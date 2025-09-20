@echo off
REM Database setup script for AI Timeblocker
echo 🚀 Setting up AI Timeblocker database...

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ❌ DATABASE_URL environment variable is not set
    echo Please set DATABASE_URL in your .env.local file
    echo Example: DATABASE_URL=postgresql://username:password@localhost:5432/ai_timeblocker
    pause
    exit /b 1
)

REM Generate Prisma client
echo 📦 Generating Prisma client...
npm run db:generate

REM Push schema to database
echo 🗄️  Pushing schema to database...
npm run db:push

REM Run seed data
echo 🌱 Seeding database with sample data...
npm run db:seed

echo ✅ Database setup completed successfully!
echo.
echo You can now:
echo   - Run 'npm run dev' to start the development server
echo   - Run 'npm run db:studio' to open Prisma Studio
echo   - Run 'npm run db:migrate' to create migrations
pause
