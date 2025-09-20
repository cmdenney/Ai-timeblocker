import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // Popover colors
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        
        // Primary colors for calendar events
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
          950: 'hsl(var(--primary-950))',
        },
        
        // Secondary colors
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        
        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        
        // Accent colors
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        
        // Destructive colors
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        
        // UI colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // Chart colors
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        
        // Calendar event colors
        event: {
          work: 'hsl(var(--event-work))',
          personal: 'hsl(var(--event-personal))',
          meeting: 'hsl(var(--event-meeting))',
          break: 'hsl(var(--event-break))',
          focus: 'hsl(var(--event-focus))',
          other: 'hsl(var(--event-other))',
        },
        
        // Chat message colors
        chat: {
          user: 'hsl(var(--chat-user))',
          assistant: 'hsl(var(--chat-assistant))',
          system: 'hsl(var(--chat-system))',
        },
      },
      
      // Custom spacing for calendar grids
      spacing: {
        'calendar-cell': '2.5rem',
        'calendar-gap': '0.125rem',
        'chat-bubble': '0.75rem',
        'chat-gap': '0.5rem',
      },
      
      // Typography scale for chat interface
      fontSize: {
        'chat-xs': ['0.75rem', { lineHeight: '1rem' }],
        'chat-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'chat-base': ['1rem', { lineHeight: '1.5rem' }],
        'chat-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'chat-xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      
      // Border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'chat-bubble': '1rem',
        'calendar-cell': '0.5rem',
      },
      
      // Custom animations
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'calendar-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'chat-slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'loading-dots': {
          '0%, 20%': { opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'calendar-pulse': 'calendar-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'chat-slide-in': 'chat-slide-in 0.3s ease-out',
        'loading-dots': 'loading-dots 1.4s infinite ease-in-out',
      },
      
      // Custom grid templates for calendar
      gridTemplateColumns: {
        'calendar': 'repeat(7, minmax(0, 1fr))',
        'calendar-mobile': 'repeat(1, minmax(0, 1fr))',
      },
      
      // Custom aspect ratios
      aspectRatio: {
        'calendar-cell': '1 / 1',
        'chat-bubble': 'auto / 1',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config
