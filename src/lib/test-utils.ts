// Testing utilities for comprehensive MVP testing

import { NextRequest } from 'next/server'
import { z } from 'zod'

// Test data factories
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  timezone: 'UTC',
  working_hours: { start: 9, end: 17, days: [1, 2, 3, 4, 5] },
  preferences: { theme: 'light', notifications: true },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestEvent = (overrides: Partial<any> = {}) => ({
  id: 'test-event-id',
  user_id: 'test-user-id',
  title: 'Test Event',
  description: 'Test event description',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
  is_all_day: false,
  location: 'Test Location',
  category: 'work',
  priority: 'medium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestChatMessage = (overrides: Partial<any> = {}) => ({
  id: 'test-message-id',
  session_id: 'test-session-id',
  role: 'user',
  content: 'Test message',
  metadata: null,
  created_at: new Date().toISOString(),
  ...overrides
})

// Mock request factory
export const createMockRequest = (options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: any
  params?: Record<string, string>
} = {}): NextRequest => {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    params = {}
  } = options

  const request = new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })

  // Add params to request
  Object.entries(params).forEach(([key, value]) => {
    request.nextUrl.searchParams.set(key, value)
  })

  return request
}

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
  process.env.GITHUB_CLIENT_ID = 'test-github-client-id'
  process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret'
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
}

// Test scenarios
export const testScenarios = {
  // Happy path scenarios
  happyPath: {
    userSignup: {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      fullName: 'New User'
    },
    userLogin: {
      email: 'test@example.com',
      password: 'password123'
    },
    createEvent: {
      title: 'Team Meeting',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      category: 'meeting'
    },
    sendChatMessage: {
      content: 'Schedule a meeting for tomorrow at 2pm',
      sessionId: 'test-session'
    }
  },

  // Error scenarios
  errorScenarios: {
    invalidEmail: {
      email: 'invalid-email',
      password: 'password123'
    },
    weakPassword: {
      email: 'test@example.com',
      password: '123'
    },
    missingRequiredFields: {
      title: 'Test Event'
      // Missing startTime and endTime
    },
    invalidDateRange: {
      title: 'Test Event',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() - 60 * 60 * 1000).toISOString() // End before start
    },
    emptyChatMessage: {
      content: '',
      sessionId: 'test-session'
    }
  },

  // Edge cases
  edgeCases: {
    veryLongTitle: {
      title: 'A'.repeat(1000),
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    },
    specialCharacters: {
      title: 'Meeting with @#$%^&*()',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    },
    unicodeCharacters: {
      title: '会议 🎉 测试',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    },
    pastEvent: {
      title: 'Past Event',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      endTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    }
  }
}

// Validation schemas for testing
export const testSchemas = {
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    full_name: z.string().optional(),
    created_at: z.string()
  }),
  
  event: z.object({
    id: z.string(),
    title: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    user_id: z.string()
  }),
  
  chatMessage: z.object({
    id: z.string(),
    content: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    created_at: z.string()
  })
}

// Test utilities
export const testUtils = {
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random test data
  randomEmail: () => `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
  randomString: (length: number) => Math.random().toString(36).substr(2, length),
  randomDate: (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  
  // Clean up test data
  cleanup: async () => {
    // TODO: Implement cleanup logic for test data
    console.log('Cleaning up test data...')
  },
  
  // Assert helpers
  assertValidResponse: (response: Response, expectedStatus: number = 200) => {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`)
    }
  },
  
  assertValidJson: async (response: Response) => {
    const data = await response.json()
    if (typeof data !== 'object' || data === null) {
      throw new Error('Response is not valid JSON')
    }
    return data
  }
}

// Performance testing utilities
export const performanceUtils = {
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    return { result, duration }
  },
  
  measureMemory: () => {
    if (process.memoryUsage) {
      return process.memoryUsage()
    }
    return null
  }
}

// Mock external services
export const mockServices = {
  openai: {
    createChatCompletion: jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Mocked response' } }]
    })
  },
  
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: createTestUser() } })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: createTestUser() })
        })
      })
    })
  }
}
