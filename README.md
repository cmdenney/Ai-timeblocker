# AI Timeblocker 🚀

An intelligent time blocking and calendar management application powered by AI, built with Next.js 15, TypeScript, and Supabase.

## ✨ Features

- **🤖 AI-Powered Scheduling**: Natural language event creation and management
- **📅 Smart Calendar**: Month, week, and day views with drag-and-drop functionality
- **💬 Intelligent Chat**: ChatGPT-style interface for calendar interactions
- **🔐 Secure Authentication**: OAuth integration with Google and GitHub
- **🔄 Real-time Sync**: Bidirectional Google Calendar synchronization
- **📊 Analytics**: User activity tracking and insights
- **🎨 Modern UI**: Beautiful, responsive design with Shadcn/UI components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: OpenAI GPT-4, Natural Language Processing
- **Calendar**: Google Calendar API
- **UI**: Shadcn/UI, Radix UI, Lucide React
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Console account
- GitHub account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cmdenney/Ai-timeblocker.git
   cd Ai-timeblocker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # NextAuth.js Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_key_here_must_be_at_least_32_characters
   NEXTAUTH_URL=http://localhost:3000
   
   # OAuth Providers
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Google Calendar API
   GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
   GOOGLE_CALENDAR_WEBHOOK_URL=https://your-domain.com/api/calendar/webhook
   
   # Application Configuration
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Bug Fixes Report](docs/BUG_FIXES_REPORT.md)
- [Build Status](docs/BUILD_STATUS.md)

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > API > Service Role to get your service role key
4. Run the SQL schema from `supabase/schema.sql`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API and Google Calendar API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key in the API Keys section

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── calendar/          # Calendar pages
│   ├── chat/              # Chat pages
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── calendar/          # Calendar components
│   ├── chat/              # Chat components
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase integration
│   ├── nlp/               # NLP processing
│   └── openai/            # OpenAI integration
├── types/                 # TypeScript type definitions
└── hooks/                 # React hooks
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

See [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) for detailed instructions.

## 📊 Monitoring

The application includes comprehensive monitoring:

- **Health Check**: `/api/health`
- **Error Tracking**: Built-in error boundaries and logging
- **Performance Monitoring**: Response time and memory usage tracking
- **Security Monitoring**: Rate limiting and abuse detection

## 🔒 Security

- **Authentication**: NextAuth.js with OAuth providers
- **Authorization**: Row Level Security (RLS) in Supabase
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Protection against abuse
- **Security Headers**: Comprehensive security headers
- **CORS**: Proper CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - The backend platform
- [OpenAI](https://openai.com/) - The AI platform
- [Shadcn/UI](https://ui.shadcn.com/) - The UI components
- [Vercel](https://vercel.com/) - The deployment platform

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/cmdenney/Ai-timeblocker/issues)
3. Create a new issue if needed

---

**Built with ❤️ by the AI Timeblocker Team**