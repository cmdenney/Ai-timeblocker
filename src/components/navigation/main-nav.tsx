'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  BarChart3, 
  Settings, 
  User, 
  Home,
  MessageSquare
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MainNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) {
    return null
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AT</span>
              </div>
              <span className="font-bold text-xl">AI TimeBlocker</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Button
                    key={item.name}
                    asChild
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'justify-start',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <SignOutButton user={session.user} />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="flex space-x-1 py-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Button
                  key={item.name}
                  asChild
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'flex-1 justify-center',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
