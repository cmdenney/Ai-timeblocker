'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Settings, 
  User, 
  Menu,
  Calendar,
  ChevronDown,
  X,
  Clock,
  Grid3X3,
  List
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'

// Types
export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewChange?: (view: CalendarView) => void
  onCreateEvent?: (date?: Date) => void
  onSearch?: (query: string) => void
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  className?: string
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  onViewChange,
  onCreateEvent,
  onSearch,
  user,
  className = ''
}: CalendarHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentView, setCurrentView] = useState<CalendarView>('month')
  
  const datePickerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isSearchOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return // Don't interfere with browser shortcuts
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handlePreviousMonth()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNextMonth()
          break
        case 'Home':
          event.preventDefault()
          handleToday()
          break
        case '/':
          event.preventDefault()
          setIsSearchOpen(true)
          break
        case 'Escape':
          setIsSearchOpen(false)
          setIsDatePickerOpen(false)
          setIsUserMenuOpen(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Navigation handlers
  const handlePreviousMonth = () => {
    const newDate = subMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view)
    onViewChange?.(view)
  }

  const handleCreateEvent = () => {
    onCreateEvent?.(currentDate)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleDateSelect = (date: Date) => {
    onDateChange(date)
    setIsDatePickerOpen(false)
  }

  // Generate month options for dropdown
  const generateMonthOptions = () => {
    const months = []
    const currentYear = new Date().getFullYear()
    
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1)
        months.push({
          date,
          label: format(date, 'MMMM yyyy'),
          isCurrent: year === currentDate.getFullYear() && month === currentDate.getMonth()
        })
      }
    }
    
    return months
  }

  const monthOptions = generateMonthOptions()

  return (
    <header className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - App Title & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>

            {/* App Title */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
                AI Timeblockr
              </h1>
            </div>
          </div>

          {/* Center Section - Navigation */}
          <div className="flex items-center gap-4">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Month/Year Display */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Select month and year"
              >
                <span className="text-lg font-medium text-gray-900">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* Date Picker Dropdown */}
              {isDatePickerOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    {monthOptions.map((option) => (
                      <button
                        key={option.date.toISOString()}
                        onClick={() => handleDateSelect(option.date)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          option.isCurrent
                            ? 'bg-blue-100 text-blue-900 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Today Button */}
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              aria-label="Go to today"
            >
              Today
            </button>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search events..."
                      className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Search events"
                >
                  <Search className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* View Toggles */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Month view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Week view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewChange('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Day view"
              >
                <Clock className="h-4 w-4" />
              </button>
            </div>

            {/* Add Event Button */}
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              aria-label="Create new event"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Event</span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                      Calendar Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                      Notification Preferences
                    </button>
                    <hr className="my-2" />
                    <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {/* Mobile View Toggles */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewChange('month')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => handleViewChange('week')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => handleViewChange('day')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'day'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Day
                </button>
              </div>

              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = [
    { key: '←', description: 'Previous month' },
    { key: '→', description: 'Next month' },
    { key: 'Home', description: 'Go to today' },
    { key: '/', description: 'Focus search' },
    { key: 'Esc', description: 'Close dialogs' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Keyboard shortcuts"
      >
        <span className="text-sm font-mono text-gray-500">⌘?</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 text-xs font-mono rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
