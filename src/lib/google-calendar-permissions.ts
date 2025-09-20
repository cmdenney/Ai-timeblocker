import { z } from 'zod'
import { GoogleCalendarClient } from './google-calendar'

// Permission types
export interface CalendarPermission {
  id: string
  calendarId: string
  role: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  scope: {
    type: 'user' | 'group' | 'domain' | 'default'
    value: string
  }
  displayName?: string
  emailAddress?: string
  deleted?: boolean
  summary?: string
  description?: string
  backgroundColor?: string
  foregroundColor?: string
  accessRole?: string
  defaultReminders?: Array<{
    method: 'email' | 'popup'
    minutes: number
  }>
  notificationSettings?: {
    notifications: Array<{
      type: 'eventCreation' | 'eventChange' | 'eventCancellation' | 'eventResponse' | 'agenda'
      method: 'email'
    }>
  }
}

// Permission request types
export interface PermissionRequest {
  id: string
  calendarId: string
  role: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  scope: {
    type: 'user' | 'group' | 'domain' | 'default'
    value: string
  }
  sendNotifications?: boolean
  message?: string
}

// Validation schemas
const CalendarPermissionSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  role: z.enum(['owner', 'writer', 'reader', 'freeBusyReader']),
  scope: z.object({
    type: z.enum(['user', 'group', 'domain', 'default']),
    value: z.string()
  }),
  displayName: z.string().optional(),
  emailAddress: z.string().email().optional(),
  deleted: z.boolean().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  accessRole: z.string().optional(),
  defaultReminders: z.array(z.object({
    method: z.enum(['email', 'popup']),
    minutes: z.number()
  })).optional(),
  notificationSettings: z.object({
    notifications: z.array(z.object({
      type: z.enum(['eventCreation', 'eventChange', 'eventCancellation', 'eventResponse', 'agenda']),
      method: z.literal('email')
    }))
  }).optional()
})

const PermissionRequestSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  role: z.enum(['owner', 'writer', 'reader', 'freeBusyReader']),
  scope: z.object({
    type: z.enum(['user', 'group', 'domain', 'default']),
    value: z.string()
  }),
  sendNotifications: z.boolean().optional(),
  message: z.string().optional()
})

// Calendar permissions manager
export class GoogleCalendarPermissionsManager {
  private permissions: Map<string, CalendarPermission> = new Map()
  private permissionRequests: Map<string, PermissionRequest> = new Map()

  // Grant permission to calendar
  async grantPermission(
    googleClient: GoogleCalendarClient,
    request: PermissionRequest
  ): Promise<CalendarPermission> {
    try {
      // Validate request
      const validatedRequest = PermissionRequestSchema.parse(request)

      // Create permission in Google Calendar
      const response = await googleClient.calendar.acl.insert({
        calendarId: validatedRequest.calendarId,
        requestBody: {
          role: validatedRequest.role,
          scope: validatedRequest.scope
        },
        sendNotifications: validatedRequest.sendNotifications || false
      })

      // Create permission object
      const permission: CalendarPermission = {
        id: response.data.id || validatedRequest.id,
        calendarId: validatedRequest.calendarId,
        role: validatedRequest.role,
        scope: {
          type: validatedRequest.scope.type,
          value: validatedRequest.scope.value
        },
        displayName: (response.data as any).displayName,
        emailAddress: (response.data as any).emailAddress,
        deleted: (response.data as any).deleted,
        summary: (response.data as any).summary,
        description: (response.data as any).description,
        backgroundColor: (response.data as any).backgroundColor,
        foregroundColor: (response.data as any).foregroundColor,
        accessRole: (response.data as any).accessRole,
        defaultReminders: (response.data as any).defaultReminders?.map(reminder => ({
          method: reminder.method as 'email' | 'popup',
          minutes: reminder.minutes || 0
        })),
        notificationSettings: (response.data as any).notificationSettings ? {
          notifications: (response.data as any).notificationSettings.notifications?.map(notification => ({
            type: notification.type as 'eventCreation' | 'eventChange' | 'eventCancellation' | 'eventResponse' | 'agenda',
            method: 'email' as const
          })) || []
        } : undefined
      }

      // Store permission
      this.permissions.set(permission.id, permission)

      return permission
    } catch (error) {
      console.error('Error granting permission:', error)
      throw new Error(`Failed to grant permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Revoke permission from calendar
  async revokePermission(
    googleClient: GoogleCalendarClient,
    calendarId: string,
    permissionId: string
  ): Promise<void> {
    try {
      // Delete permission from Google Calendar
      await googleClient.calendar.acl.delete({
        calendarId,
        ruleId: permissionId
      })

      // Remove from local storage
      this.permissions.delete(permissionId)
    } catch (error) {
      console.error('Error revoking permission:', error)
      throw new Error(`Failed to revoke permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // List calendar permissions
  async listPermissions(
    googleClient: GoogleCalendarClient,
    calendarId: string
  ): Promise<CalendarPermission[]> {
    try {
      // Get permissions from Google Calendar
      const response = await googleClient.calendar.acl.list({
        calendarId
      })

      const permissions: CalendarPermission[] = (response.data.items || []).map(item => ({
        id: item.id || '',
        calendarId,
        role: item.role as 'owner' | 'writer' | 'reader' | 'freeBusyReader',
        scope: {
          type: item.scope?.type as 'user' | 'group' | 'domain' | 'default',
          value: item.scope?.value || ''
        },
        displayName: (item as any).displayName,
        emailAddress: (item as any).emailAddress,
        deleted: (item as any).deleted,
        summary: (item as any).summary,
        description: (item as any).description,
        backgroundColor: (item as any).backgroundColor,
        foregroundColor: (item as any).foregroundColor,
        accessRole: (item as any).accessRole,
        defaultReminders: (item as any).defaultReminders?.map(reminder => ({
          method: reminder.method as 'email' | 'popup',
          minutes: reminder.minutes || 0
        })),
        notificationSettings: (item as any).notificationSettings ? {
          notifications: (item as any).notificationSettings.notifications?.map(notification => ({
            type: notification.type as 'eventCreation' | 'eventChange' | 'eventCancellation' | 'eventResponse' | 'agenda',
            method: 'email' as const
          })) || []
        } : undefined
      }))

      // Update local storage
      for (const permission of permissions) {
        this.permissions.set(permission.id, permission)
      }

      return permissions
    } catch (error) {
      console.error('Error listing permissions:', error)
      throw new Error(`Failed to list permissions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update permission role
  async updatePermission(
    googleClient: GoogleCalendarClient,
    calendarId: string,
    permissionId: string,
    newRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  ): Promise<CalendarPermission> {
    try {
      // Update permission in Google Calendar
      const response = await googleClient.calendar.acl.update({
        calendarId,
        ruleId: permissionId,
        requestBody: {
          role: newRole
        }
      })

      // Create updated permission object
      const permission: CalendarPermission = {
        id: response.data.id || permissionId,
        calendarId,
        role: newRole,
        scope: {
          type: (response.data as any).scope?.type as 'user' | 'group' | 'domain' | 'default',
          value: (response.data as any).scope?.value || ''
        },
        displayName: (response.data as any).displayName,
        emailAddress: (response.data as any).emailAddress,
        deleted: (response.data as any).deleted,
        summary: (response.data as any).summary,
        description: (response.data as any).description,
        backgroundColor: (response.data as any).backgroundColor,
        foregroundColor: (response.data as any).foregroundColor,
        accessRole: (response.data as any).accessRole,
        defaultReminders: (response.data as any).defaultReminders?.map(reminder => ({
          method: reminder.method as 'email' | 'popup',
          minutes: reminder.minutes || 0
        })),
        notificationSettings: (response.data as any).notificationSettings ? {
          notifications: (response.data as any).notificationSettings.notifications?.map(notification => ({
            type: notification.type as 'eventCreation' | 'eventChange' | 'eventCancellation' | 'eventResponse' | 'agenda',
            method: 'email' as const
          })) || []
        } : undefined
      }

      // Update local storage
      this.permissions.set(permission.id, permission)

      return permission
    } catch (error) {
      console.error('Error updating permission:', error)
      throw new Error(`Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if user has permission
  hasPermission(
    calendarId: string,
    userEmail: string,
    requiredRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  ): boolean {
    const roleHierarchy = {
      'owner': 4,
      'writer': 3,
      'reader': 2,
      'freeBusyReader': 1
    }

    const requiredLevel = roleHierarchy[requiredRole]
    
    for (const permission of this.permissions.values()) {
      if (permission.calendarId === calendarId && 
          permission.emailAddress === userEmail &&
          !permission.deleted) {
        const userLevel = roleHierarchy[permission.role]
        return userLevel >= requiredLevel
      }
    }

    return false
  }

  // Get user's role for calendar
  getUserRole(calendarId: string, userEmail: string): 'owner' | 'writer' | 'reader' | 'freeBusyReader' | null {
    for (const permission of this.permissions.values()) {
      if (permission.calendarId === calendarId && 
          permission.emailAddress === userEmail &&
          !permission.deleted) {
        return permission.role
      }
    }

    return null
  }

  // Get all permissions for calendar
  getCalendarPermissions(calendarId: string): CalendarPermission[] {
    return Array.from(this.permissions.values())
      .filter(permission => permission.calendarId === calendarId)
  }

  // Get permission by ID
  getPermission(permissionId: string): CalendarPermission | undefined {
    return this.permissions.get(permissionId)
  }

  // Clear all permissions
  clearPermissions(): void {
    this.permissions.clear()
  }

  // Get permission statistics
  getPermissionStats(): {
    totalPermissions: number
    permissionsByRole: Record<string, number>
    permissionsByCalendar: Record<string, number>
  } {
    const stats = {
      totalPermissions: this.permissions.size,
      permissionsByRole: {} as Record<string, number>,
      permissionsByCalendar: {} as Record<string, number>
    }

    for (const permission of this.permissions.values()) {
      // Count by role
      stats.permissionsByRole[permission.role] = (stats.permissionsByRole[permission.role] || 0) + 1
      
      // Count by calendar
      stats.permissionsByCalendar[permission.calendarId] = (stats.permissionsByCalendar[permission.calendarId] || 0) + 1
    }

    return stats
  }
}

// Global permissions manager instance
export const permissionsManager = new GoogleCalendarPermissionsManager()

// Permission validation utilities
export class PermissionValidator {
  // Validate permission request
  static validatePermissionRequest(request: any): PermissionRequest {   
    return request as PermissionRequest
  }

  // Validate calendar permission
  static validateCalendarPermission(permission: any): CalendarPermission {
    return permission as CalendarPermission
  }

  // Check if role is valid
  static isValidRole(role: string): role is 'owner' | 'writer' | 'reader' | 'freeBusyReader' {
    return ['owner', 'writer', 'reader', 'freeBusyReader'].includes(role)
  }

  // Check if scope type is valid
  static isValidScopeType(type: string): type is 'user' | 'group' | 'domain' | 'default' {
    return ['user', 'group', 'domain', 'default'].includes(type)
  }

  // Validate email address
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate calendar ID
  static isValidCalendarId(calendarId: string): boolean {
    // Google Calendar IDs are typically email addresses or 'primary'
    return calendarId === 'primary' || this.isValidEmail(calendarId)
  }
}

// Permission helper functions
export function createPermissionRequest(
  calendarId: string,
  role: 'owner' | 'writer' | 'reader' | 'freeBusyReader',
  scopeType: 'user' | 'group' | 'domain' | 'default',
  scopeValue: string,
  options: {
    sendNotifications?: boolean
    message?: string
  } = {}
): PermissionRequest {
  return {
    id: `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    calendarId,
    role,
    scope: {
      type: scopeType,
      value: scopeValue
    },
    sendNotifications: options.sendNotifications || false,
    message: options.message
  }
}

export function createUserPermissionRequest(
  calendarId: string,
  userEmail: string,
  role: 'owner' | 'writer' | 'reader' | 'freeBusyReader',
  options: {
    sendNotifications?: boolean
    message?: string
  } = {}
): PermissionRequest {
  return createPermissionRequest(calendarId, role, 'user', userEmail, options)
}

export function createGroupPermissionRequest(
  calendarId: string,
  groupEmail: string,
  role: 'owner' | 'writer' | 'reader' | 'freeBusyReader',
  options: {
    sendNotifications?: boolean
    message?: string
  } = {}
): PermissionRequest {
  return createPermissionRequest(calendarId, role, 'group', groupEmail, options)
}

export function createDomainPermissionRequest(
  calendarId: string,
  domain: string,
  role: 'owner' | 'writer' | 'reader' | 'freeBusyReader',
  options: {
    sendNotifications?: boolean
    message?: string
  } = {}
): PermissionRequest {
  return createPermissionRequest(calendarId, role, 'domain', domain, options)
}
