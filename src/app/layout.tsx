import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI TimeBlocker',
  description: 'Intelligent time blocking and calendar management powered by AI',
  keywords: ['time management', 'calendar', 'AI', 'productivity', 'scheduling'],
  authors: [{ name: 'AI TimeBlocker Team' }],
  creator: 'AI TimeBlocker',
  publisher: 'AI TimeBlocker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ai-timeblocker.vercel.app'),
  openGraph: {
    title: 'AI TimeBlocker',
    description: 'Intelligent time blocking and calendar management powered by AI',
    url: 'https://ai-timeblocker.vercel.app',
    siteName: 'AI TimeBlocker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI TimeBlocker',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI TimeBlocker',
    description: 'Intelligent time blocking and calendar management powered by AI',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthSessionProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
          </AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
