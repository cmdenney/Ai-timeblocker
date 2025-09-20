import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz'
import { addDays, addWeeks, addMonths, addYears, startOfDay, endOfDay, isSameDay, isAfter, isBefore } from 'date-fns'

// Timezone information interface
export interface TimezoneInfo {
  timezone: string
  offset: string
  abbreviation: string
  isDST: boolean
  utcOffset: number // in minutes
}

// Date range interface
export interface DateRange {
  start: Date
  end: Date
  timezone: string
}

// Working hours interface
export interface WorkingHours {
  start: string // HH:mm format
  end: string // HH:mm format
  timezone: string
  days: number[] // 0 = Sunday, 1 = Monday, etc.
}

// Common timezones with their UTC offsets
export const COMMON_TIMEZONES: Record<string, TimezoneInfo> = {
  'UTC': { timezone: 'UTC', offset: '+00:00', abbreviation: 'UTC', isDST: false, utcOffset: 0 },
  'America/New_York': { timezone: 'America/New_York', offset: '-05:00', abbreviation: 'EST', isDST: true, utcOffset: -300 },
  'America/Chicago': { timezone: 'America/Chicago', offset: '-06:00', abbreviation: 'CST', isDST: true, utcOffset: -360 },
  'America/Denver': { timezone: 'America/Denver', offset: '-07:00', abbreviation: 'MST', isDST: true, utcOffset: -420 },
  'America/Los_Angeles': { timezone: 'America/Los_Angeles', offset: '-08:00', abbreviation: 'PST', isDST: true, utcOffset: -480 },
  'Europe/London': { timezone: 'Europe/London', offset: '+00:00', abbreviation: 'GMT', isDST: true, utcOffset: 0 },
  'Europe/Paris': { timezone: 'Europe/Paris', offset: '+01:00', abbreviation: 'CET', isDST: true, utcOffset: 60 },
  'Europe/Berlin': { timezone: 'Europe/Berlin', offset: '+01:00', abbreviation: 'CET', isDST: true, utcOffset: 60 },
  'Asia/Tokyo': { timezone: 'Asia/Tokyo', offset: '+09:00', abbreviation: 'JST', isDST: false, utcOffset: 540 },
  'Asia/Shanghai': { timezone: 'Asia/Shanghai', offset: '+08:00', abbreviation: 'CST', isDST: false, utcOffset: 480 },
  'Asia/Kolkata': { timezone: 'Asia/Kolkata', offset: '+05:30', abbreviation: 'IST', isDST: false, utcOffset: 330 },
  'Australia/Sydney': { timezone: 'Australia/Sydney', offset: '+10:00', abbreviation: 'AEST', isDST: true, utcOffset: 600 },
  'Pacific/Auckland': { timezone: 'Pacific/Auckland', offset: '+12:00', abbreviation: 'NZST', isDST: true, utcOffset: 720 }
}

// Timezone utilities class
export class TimezoneUtils {
  private userTimezone: string

  constructor(timezone: string = 'UTC') {
    this.userTimezone = timezone
  }

  // Convert UTC date to user timezone
  toUserTimezone(utcDate: Date): Date {
    return utcToZonedTime(utcDate, this.userTimezone)
  }

  // Convert user timezone date to UTC
  toUTC(userDate: Date): Date {
    return zonedTimeToUtc(userDate, this.userTimezone)
  }

  // Format date in user timezone
  formatInUserTimezone(date: Date, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
    return formatTz(date, formatStr, { timeZone: this.userTimezone })
  }

  // Get current time in user timezone
  getCurrentTimeInUserTimezone(): Date {
    return this.toUserTimezone(new Date())
  }

  // Get timezone information
  getTimezoneInfo(timezone: string = this.userTimezone): TimezoneInfo {
    const tzInfo = COMMON_TIMEZONES[timezone]
    if (tzInfo) {
      return tzInfo
    }

    // For unknown timezones, try to get basic info
    const now = new Date()
    const utcOffset = this.getTimezoneOffset(timezone)
    
    return {
      timezone,
      offset: this.formatOffset(utcOffset),
      abbreviation: this.getTimezoneAbbreviation(timezone),
      isDST: this.isDST(timezone, now),
      utcOffset
    }
  }

  // Get timezone offset in minutes
  private getTimezoneOffset(timezone: string): number {
    const now = new Date()
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const targetTime = new Date(utcTime + (this.getTimezoneOffsetMs(timezone)))
    return (targetTime.getTime() - now.getTime()) / 60000
  }

  // Get timezone offset in milliseconds
  private getTimezoneOffsetMs(timezone: string): number {
    const now = new Date()
    const utc1 = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
    const utc2 = new Date(utc1.toLocaleString('en-US', { timeZone: timezone }))
    return utc2.getTime() - utc1.getTime()
  }

  // Format offset as string
  private formatOffset(offsetMinutes: number): string {
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const absOffset = Math.abs(offsetMinutes)
    const hours = Math.floor(absOffset / 60)
    const minutes = absOffset % 60
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Get timezone abbreviation
  private getTimezoneAbbreviation(timezone: string): string {
    const now = new Date()
    return new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || 'UTC'
  }

  // Check if DST is active
  private isDST(timezone: string, date: Date): boolean {
    const jan = new Date(date.getFullYear(), 0, 1)
    const jul = new Date(date.getFullYear(), 6, 1)
    
    const janOffset = this.getTimezoneOffsetMs(timezone)
    const julOffset = this.getTimezoneOffsetMs(timezone)
    
    return Math.max(janOffset, julOffset) !== Math.min(janOffset, julOffset)
  }

  // Parse relative date strings
  parseRelativeDate(input: string, baseDate: Date = new Date()): Date | null {
    const lowerInput = input.toLowerCase().trim()
    const currentDate = this.toUserTimezone(baseDate)

    // Today
    if (lowerInput === 'today') {
      return startOfDay(currentDate)
    }

    // Tomorrow
    if (lowerInput === 'tomorrow') {
      return startOfDay(addDays(currentDate, 1))
    }

    // Yesterday
    if (lowerInput === 'yesterday') {
      return startOfDay(addDays(currentDate, -1))
    }

    // Next week
    if (lowerInput === 'next week') {
      return startOfDay(addWeeks(currentDate, 1))
    }

    // Last week
    if (lowerInput === 'last week') {
      return startOfDay(addWeeks(currentDate, -1))
    }

    // Next month
    if (lowerInput === 'next month') {
      return startOfDay(addMonths(currentDate, 1))
    }

    // Last month
    if (lowerInput === 'last month') {
      return startOfDay(addMonths(currentDate, -1))
    }

    // Next year
    if (lowerInput === 'next year') {
      return startOfDay(addYears(currentDate, 1))
    }

    // Last year
    if (lowerInput === 'last year') {
      return startOfDay(addYears(currentDate, -1))
    }

    // Day of week patterns
    const dayPatterns = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    }

    for (const [day, dayOfWeek] of Object.entries(dayPatterns)) {
      if (lowerInput.includes(day)) {
        const currentDayOfWeek = currentDate.getDay()
        let daysToAdd = dayOfWeek - currentDayOfWeek
        
        if (daysToAdd <= 0) {
          daysToAdd += 7
        }

        // Handle "next" prefix
        if (lowerInput.includes('next')) {
          daysToAdd += 7
        }

        return startOfDay(addDays(currentDate, daysToAdd))
      }
    }

    return null
  }

  // Parse time strings
  parseTime(input: string, baseDate: Date = new Date()): Date | null {
    const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
    const match = input.match(timePattern)
    
    if (!match) return null

    let hours = parseInt(match[1])
    const minutes = parseInt(match[2] || '0')
    const period = match[3]?.toLowerCase()

    // Convert to 24-hour format
    if (period === 'am' && hours === 12) {
      hours = 0
    } else if (period === 'pm' && hours !== 12) {
      hours += 12
    }

    // Validate time
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null
    }

    const currentDate = this.toUserTimezone(baseDate)
    const timeDate = new Date(currentDate)
    timeDate.setHours(hours, minutes, 0, 0)

    return timeDate
  }

  // Parse date and time combination
  parseDateTime(input: string, baseDate: Date = new Date()): Date | null {
    const currentDate = this.toUserTimezone(baseDate)
    
    // Try to parse as relative date first
    const relativeDate = this.parseRelativeDate(input, baseDate)
    if (relativeDate) {
      return relativeDate
    }

    // Try to parse as absolute date
    const absoluteDate = this.parseAbsoluteDate(input)
    if (absoluteDate) {
      return absoluteDate
    }

    // Try to parse as time only
    const timeOnly = this.parseTime(input, baseDate)
    if (timeOnly) {
      return timeOnly
    }

    return null
  }

  // Parse absolute date strings
  private parseAbsoluteDate(input: string): Date | null {
    // Try various date formats
    const formats = [
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'dd/MM/yyyy',
      'MMM dd, yyyy',
      'MMMM dd, yyyy',
      'dd MMM yyyy',
      'yyyy/MM/dd'
    ]

    for (const format of formats) {
      try {
        const parsed = new Date(input)
        if (!isNaN(parsed.getTime())) {
          return this.toUserTimezone(parsed)
        }
      } catch (error) {
        // Continue to next format
      }
    }

    return null
  }

  // Get working hours for a specific date
  getWorkingHours(date: Date, workingHours: WorkingHours): DateRange | null {
    if (workingHours.timezone !== this.userTimezone) {
      // Convert working hours to user timezone
      const workingHoursDate = this.toUserTimezone(date)
      const dayOfWeek = workingHoursDate.getDay()
      
      if (!workingHours.days.includes(dayOfWeek)) {
        return null
      }

      const [startHour, startMinute] = workingHours.start.split(':').map(Number)
      const [endHour, endMinute] = workingHours.end.split(':').map(Number)

      const start = new Date(workingHoursDate)
      start.setHours(startHour, startMinute, 0, 0)

      const end = new Date(workingHoursDate)
      end.setHours(endHour, endMinute, 0, 0)

      return {
        start,
        end,
        timezone: this.userTimezone
      }
    }

    return null
  }

  // Check if a date is within working hours
  isWithinWorkingHours(date: Date, workingHours: WorkingHours): boolean {
    const workingHoursRange = this.getWorkingHours(date, workingHours)
    if (!workingHoursRange) return false

    return date >= workingHoursRange.start && date <= workingHoursRange.end
  }

  // Get next available working time
  getNextWorkingTime(date: Date, workingHours: WorkingHours): Date | null {
    const workingHoursRange = this.getWorkingHours(date, workingHours)
    if (!workingHoursRange) return null

    if (date < workingHoursRange.start) {
      return workingHoursRange.start
    } else if (date > workingHoursRange.end) {
      // Move to next working day
      const nextDay = addDays(date, 1)
      return this.getNextWorkingTime(startOfDay(nextDay), workingHours)
    }

    return date
  }

  // Calculate time difference between timezones
  getTimeDifference(timezone1: string, timezone2: string): number {
    const now = new Date()
    const offset1 = this.getTimezoneOffset(timezone1)
    const offset2 = this.getTimezoneOffset(timezone2)
    return offset1 - offset2
  }

  // Convert time between timezones
  convertTimeBetweenTimezones(date: Date, fromTimezone: string, toTimezone: string): Date {
    const utcDate = zonedTimeToUtc(date, fromTimezone)
    return utcToZonedTime(utcDate, toTimezone)
  }

  // Get all available timezones
  static getAvailableTimezones(): string[] {
    return Object.keys(COMMON_TIMEZONES)
  }

  // Get timezone by offset
  static getTimezoneByOffset(offsetMinutes: number): string[] {
    return Object.entries(COMMON_TIMEZONES)
      .filter(([_, info]) => info.utcOffset === offsetMinutes)
      .map(([timezone, _]) => timezone)
  }

  // Get timezone by abbreviation
  static getTimezoneByAbbreviation(abbreviation: string): string[] {
    return Object.entries(COMMON_TIMEZONES)
      .filter(([_, info]) => info.abbreviation === abbreviation)
      .map(([timezone, _]) => timezone)
  }
}

// Utility functions
export function createTimezoneUtils(timezone: string = 'UTC'): TimezoneUtils {
  return new TimezoneUtils(timezone)
}

export function formatDateInTimezone(
  date: Date, 
  timezone: string, 
  formatStr: string = 'yyyy-MM-dd HH:mm'
): string {
  return formatTz(date, formatStr, { timeZone: timezone })
}

export function convertDateToTimezone(date: Date, timezone: string): Date {
  return utcToZonedTime(date, timezone)
}

export function convertDateFromTimezone(date: Date, timezone: string): Date {
  return zonedTimeToUtc(date, timezone)
}

export function getTimezoneOffset(timezone: string): number {
  const now = new Date()
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const targetTime = new Date(utcTime + (getTimezoneOffsetMs(timezone)))
  return (targetTime.getTime() - now.getTime()) / 60000
}

function getTimezoneOffsetMs(timezone: string): number {
  const now = new Date()
  const utc1 = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
  const utc2 = new Date(utc1.toLocaleString('en-US', { timeZone: timezone }))
  return utc2.getTime() - utc1.getTime()
}
