import { cva, type VariantProps } from 'class-variance-authority'

// Calendar Event Variants
export const calendarEventVariants = cva(
  'calendar-event absolute inset-1 rounded-sm text-xs font-medium text-white shadow-sm',
  {
    variants: {
      category: {
        work: 'bg-event-work',
        personal: 'bg-event-personal',
        meeting: 'bg-event-meeting',
        break: 'bg-event-break',
        focus: 'bg-event-focus',
        other: 'bg-event-other',
      },
      priority: {
        low: 'opacity-60',
        medium: 'opacity-80',
        high: 'opacity-100',
        urgent: 'opacity-100 ring-1 ring-white/50',
      },
      size: {
        sm: 'text-xs px-1 py-0.5',
        md: 'text-sm px-2 py-1',
        lg: 'text-base px-3 py-1.5',
      },
    },
    defaultVariants: {
      category: 'work',
      priority: 'medium',
      size: 'sm',
    },
  }
)

// Chat Message Variants
export const chatMessageVariants = cva(
  'chat-bubble max-w-xs lg:max-w-md px-chat-bubble py-2 rounded-chat-bubble text-chat-sm',
  {
    variants: {
      type: {
        user: 'bg-chat-user text-white ml-auto',
        assistant: 'bg-chat-assistant text-foreground mr-auto',
        system: 'bg-chat-system text-muted-foreground mx-auto text-center',
      },
      size: {
        sm: 'max-w-xs text-chat-xs px-2 py-1',
        md: 'max-w-xs lg:max-w-md text-chat-sm px-chat-bubble py-2',
        lg: 'max-w-sm lg:max-w-lg text-chat-base px-4 py-3',
      },
    },
    defaultVariants: {
      type: 'user',
      size: 'md',
    },
  }
)

// Calendar Cell Variants
export const calendarCellVariants = cva(
  'calendar-cell w-calendar-cell h-calendar-cell aspect-calendar-cell rounded-calendar-cell border border-border bg-card transition-colors duration-200',
  {
    variants: {
      state: {
        default: 'hover:bg-accent',
        today: 'bg-primary/10 border-primary/20 ring-1 ring-primary/20 hover:bg-primary/20',
        selected: 'bg-primary text-primary-foreground border-primary',
        disabled: 'opacity-50 cursor-not-allowed hover:bg-card',
        event: 'relative overflow-hidden hover:bg-accent',
      },
      size: {
        sm: 'w-8 h-8 text-xs',
        md: 'w-calendar-cell h-calendar-cell text-sm',
        lg: 'w-12 h-12 text-base',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
)

// Button Variants for Calendar Actions
export const calendarButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        calendar: 'bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
        calendar: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// Loading Animation Variants
export const loadingVariants = cva(
  'flex items-center justify-center',
  {
    variants: {
      type: {
        spinner: 'animate-spin rounded-full border-2 border-muted border-t-primary',
        dots: 'space-x-1',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
      },
      size: {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
      },
    },
    defaultVariants: {
      type: 'spinner',
      size: 'md',
    },
  }
)

// Card Variants for Calendar Views
export const calendarCardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        selected: 'border-primary ring-1 ring-primary/20',
        hover: 'hover:shadow-md transition-shadow duration-200',
        interactive: 'cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Input Variants for Calendar Forms
export const calendarInputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Time Block Variants
export const timeBlockVariants = cva(
  'relative rounded-md border p-2 text-sm font-medium transition-all duration-200',
  {
    variants: {
      category: {
        work: 'bg-event-work/10 border-event-work/20 text-event-work hover:bg-event-work/20',
        personal: 'bg-event-personal/10 border-event-personal/20 text-event-personal hover:bg-event-personal/20',
        meeting: 'bg-event-meeting/10 border-event-meeting/20 text-event-meeting hover:bg-event-meeting/20',
        break: 'bg-event-break/10 border-event-break/20 text-event-break hover:bg-event-break/20',
        focus: 'bg-event-focus/10 border-event-focus/20 text-event-focus hover:bg-event-focus/20',
        other: 'bg-event-other/10 border-event-other/20 text-event-other hover:bg-event-other/20',
      },
      priority: {
        low: 'opacity-60',
        medium: 'opacity-80',
        high: 'opacity-100 ring-1 ring-current/20',
        urgent: 'opacity-100 ring-2 ring-current/40 animate-pulse',
      },
      size: {
        sm: 'text-xs p-1',
        md: 'text-sm p-2',
        lg: 'text-base p-3',
      },
    },
    defaultVariants: {
      category: 'work',
      priority: 'medium',
      size: 'md',
    },
  }
)

// Notification Variants
export const notificationVariants = cva(
  'rounded-lg border p-4 shadow-sm transition-all duration-200',
  {
    variants: {
      type: {
        info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
        success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100',
        error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
      },
      size: {
        sm: 'p-2 text-sm',
        md: 'p-4 text-base',
        lg: 'p-6 text-lg',
      },
    },
    defaultVariants: {
      type: 'info',
      size: 'md',
    },
  }
)

// Export types for use in components
export type CalendarEventVariants = VariantProps<typeof calendarEventVariants>
export type ChatMessageVariants = VariantProps<typeof chatMessageVariants>
export type CalendarCellVariants = VariantProps<typeof calendarCellVariants>
export type CalendarButtonVariants = VariantProps<typeof calendarButtonVariants>
export type LoadingVariants = VariantProps<typeof loadingVariants>
export type CalendarCardVariants = VariantProps<typeof calendarCardVariants>
export type CalendarInputVariants = VariantProps<typeof calendarInputVariants>
export type TimeBlockVariants = VariantProps<typeof timeBlockVariants>
export type NotificationVariants = VariantProps<typeof notificationVariants>
