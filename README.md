# AI TimeBlocker

Intelligent time blocking and calendar management powered by AI. Optimize your schedule, boost productivity, and achieve your goals with smart time management.

## Features

- 🤖 **AI-Powered Scheduling**: Intelligent time blocking that adapts to your work patterns
- 📅 **Calendar Integration**: Seamless sync with Google Calendar, Outlook, and other platforms
- 📊 **Analytics & Insights**: Track productivity patterns and get actionable recommendations
- ⚡ **Real-time Optimization**: Dynamic schedule adjustments based on your energy levels
- 🎯 **Focus Management**: Deep work sessions with smart break scheduling
- 🔔 **Smart Notifications**: Context-aware reminders and alerts

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS v4
- **Development**: Turbopack for fast development
- **Code Quality**: ESLint + Prettier
- **Architecture**: Enterprise-ready with src/ directory structure

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-timeblocker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Update the `.env.local` file with your API keys and configuration.

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── calendar/          # Calendar management
│   ├── analytics/         # Analytics and insights
│   ├── settings/          # User settings
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Configuration

### TypeScript

The project uses strict TypeScript configuration with:
- Strict type checking enabled
- No implicit any
- No unchecked indexed access
- Exact optional property types

### Tailwind CSS

Configured with:
- Custom color system with CSS variables
- Dark mode support
- Responsive design utilities
- Custom animations and keyframes

### ESLint & Prettier

- TypeScript-specific rules
- React best practices
- Consistent code formatting
- Import organization

## Environment Variables

Copy `env.example` to `.env.local` and configure:

- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `DATABASE_URL` - Database connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `GOOGLE_CALENDAR_*` - Google Calendar integration keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.
