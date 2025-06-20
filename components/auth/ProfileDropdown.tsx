'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { User, LogOut, ChevronDown, Settings, Calendar, BarChart3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface ProfileDropdownProps {
  testIdPrefix?: string;
  mobileIconOnly?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ProfileDropdown({ testIdPrefix = "", mobileIconOnly = false, onOpenChange }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Helper function to update open state and notify parent
  const updateOpenState = useCallback((newIsOpen: boolean) => {
    setIsOpen(newIsOpen)
    onOpenChange?.(newIsOpen)
  }, [onOpenChange])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarCheckLoading, setCalendarCheckLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()
  const { user: userProfile, isStaff, isAdmin } = useAuthHook()

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User'
  }

  // Check Google Calendar connection status
  const checkCalendarStatus = async () => {
    try {
      setCalendarCheckLoading(true)
      const response = await fetch('/api/auth/google/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCalendarConnected(data.connected || false)
      } else {
        setCalendarConnected(false)
      }
    } catch (error) {
      console.error('Error checking Google Calendar status:', error)
      setCalendarConnected(false)
    } finally {
      setCalendarCheckLoading(false)
    }
  }

  // Handle Google Calendar connect
  const handleCalendarConnect = async () => {
    try {
      setCalendarLoading(true)
      
      // Build OAuth initiation URL
      const params = new URLSearchParams({
        action: 'connect',
        returnUrl: window.location.pathname
      })

      // Redirect to OAuth initiation endpoint
      const connectUrl = `/api/auth/google/connect?${params.toString()}`
      window.location.href = connectUrl

    } catch (error) {
      console.error('Error initiating Google Calendar connection:', error)
      setCalendarLoading(false)
    }
  }

  // Handle Google Calendar disconnect
  const handleCalendarDisconnect = async () => {
    try {
      setCalendarLoading(true)

      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setCalendarConnected(false)
        // Show success feedback
        alert('Google Calendar disconnected successfully!')
      } else {
        const error = await response.json()
        console.error('Failed to disconnect Google Calendar:', error)
        alert(`Failed to disconnect: ${error.error || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      alert('An error occurred while disconnecting. Please try again.')
    } finally {
      setCalendarLoading(false)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      updateOpenState(false)
      // Use the main auth context signOut method
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if signOut fails, force a page reload to clear state
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }

  // Check calendar status on mount
  useEffect(() => {
    if (user) {
      checkCalendarStatus()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        updateOpenState(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [updateOpenState])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => updateOpenState(!isOpen)}
        className={`flex items-center ${mobileIconOnly ? 'gap-0 p-2' : 'gap-2 px-3 py-2'} bg-muted hover:bg-accent rounded-lg transition-colors`}
        data-testid={`${testIdPrefix}profile-dropdown-button`}
        aria-label={`Profile menu for ${getUserDisplayName()}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className={`${mobileIconOnly ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground`} />
        {!mobileIconOnly && (
          <span className="text-sm font-medium text-foreground" data-testid="profile-display-name">{getUserDisplayName()}</span>
        )}
        {!mobileIconOnly && (
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-2 z-50"
          data-testid="profile-dropdown-menu"
          role="menu"
          aria-label="Profile menu"
        >
          <div className="px-4 py-2 border-b border-border" data-testid="profile-info-section">
            <p className="text-sm font-medium text-foreground truncate" data-testid="profile-name">{getUserDisplayName()}</p>
            <p className="text-xs text-muted-foreground truncate" title={user.email} data-testid="profile-email">{user.email}</p>
            {userProfile?.role && (
              <p className="text-xs text-primary capitalize font-medium mt-1" data-testid="profile-role">
                {userProfile.role}
              </p>
            )}
          </div>

          {/* My Events Link */}
          <Link
            href="/my-events"
            onClick={() => updateOpenState(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            data-testid="profile-my-events-link"
            role="menuitem"
          >
            <Calendar className="w-4 h-4" />
            My Events
          </Link>

          {/* Staff Dashboard Link - Only for organizers and admins */}
          {isStaff && (
            <Link
              href="/staff"
              onClick={() => updateOpenState(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              data-testid="profile-staff-dashboard-link"
              role="menuitem"
            >
              {isAdmin ? <Settings className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
            </Link>
          )}

          <div className="border-t border-border my-1" />

          {/* Google Calendar Connection */}
          <div className="px-4 py-2" data-testid="google-calendar-section">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Google Calendar</span>
              </div>
              
              {calendarCheckLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" data-testid="calendar-status-loading" />
              ) : (
                <div className="flex items-center gap-2">
                  {calendarConnected ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-600" data-testid="calendar-connected-icon" />
                      <button
                        onClick={handleCalendarDisconnect}
                        disabled={calendarLoading}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                        data-testid="calendar-disconnect-button"
                      >
                        {calendarLoading ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" data-testid="calendar-disconnected-icon" />
                      <button
                        onClick={handleCalendarConnect}
                        disabled={calendarLoading}
                        className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        data-testid="calendar-connect-button"
                      >
                        {calendarLoading ? 'Connecting...' : 'Connect'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border my-1" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            data-testid="profile-sign-out-button"
            role="menuitem"
            aria-label="Sign out of your account"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
} 