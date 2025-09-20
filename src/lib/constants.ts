// Application Constants
export const APP_NAME = 'AI TimeBlocker'
export const APP_DESCRIPTION = 'Intelligent time blocking and calendar management powered by AI'
export const APP_URL = 'https://ai-timeblocker.vercel.app'

// Time Constants
export const WORKING_HOURS = {
  START: '09:00',
  END: '17:00',
} as const

export const BREAK_DURATION = 15 // minutes
export const FOCUS_SESSION_DURATION = 90 // minutes
export const MAX_FOCUS_SESSIONS_PER_DAY = 4

// Calendar Categories
export const EVENT_CATEGORIES = {
  WORK: 'work',
  PERSONAL: 'personal',
  MEETING: 'meeting',
  BREAK: 'break',
  FOCUS: 'focus',
  OTHER: 'other',
} as const

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  CALENDAR: '/api/calendar',
  EVENTS: '/api/events',
  TIME_BLOCKS: '/api/time-blocks',
  ANALYTICS: '/api/analytics',
  AI_INSIGHTS: '/api/ai-insights',
  USER_PREFERENCES: '/api/user-preferences',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'ai-timeblocker-preferences',
  THEME: 'ai-timeblocker-theme',
  CALENDAR_VIEW: 'ai-timeblocker-calendar-view',
  RECENT_TIME_BLOCKS: 'ai-timeblocker-recent-blocks',
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_INSIGHTS: process.env.NODE_ENV === 'development' || process.env.ENABLE_AI_INSIGHTS === 'true',
  ENABLE_CALENDAR_SYNC: process.env.ENABLE_CALENDAR_SYNC === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === 'true',
  ENABLE_DARK_MODE: true,
  ENABLE_BETA_FEATURES: process.env.NODE_ENV === 'development',
} as const

// UI Constants
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  CALENDAR_SYNC: 'Failed to sync with calendar. Please try again.',
  AI_INSIGHTS: 'Failed to generate AI insights. Please try again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  TIME_BLOCK_CREATED: 'Time block created successfully',
  TIME_BLOCK_UPDATED: 'Time block updated successfully',
  TIME_BLOCK_DELETED: 'Time block deleted successfully',
  CALENDAR_SYNCED: 'Calendar synced successfully',
  PREFERENCES_SAVED: 'Preferences saved successfully',
} as const
