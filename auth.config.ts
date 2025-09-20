import { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export default {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar"
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnSettings = nextUrl.pathname.startsWith('/settings')
      const isOnCalendar = nextUrl.pathname.startsWith('/calendar')
      const isOnAnalytics = nextUrl.pathname.startsWith('/analytics')
      const isOnProfile = nextUrl.pathname.startsWith('/profile')
      const isOnAuth = nextUrl.pathname.startsWith('/auth')

      // Protected routes
      if (isOnDashboard || isOnSettings || isOnCalendar || isOnAnalytics || isOnProfile) {
        if (isLoggedIn) return true
        return false // Redirect to sign in page
      } 
      // Redirect logged in users away from auth pages
      else if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      // Redirect logged in users to dashboard from home
      else if (isLoggedIn && nextUrl.pathname === '/') {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      return true
    },
    async jwt({ token, account, user, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
      }

      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.image as string
        session.accessToken = token.accessToken as string
        session.provider = token.provider as string
      }
      
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
} satisfies NextAuthConfig
