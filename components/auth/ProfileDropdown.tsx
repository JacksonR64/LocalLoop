'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { User, LogOut, Settings, Calendar, BarChart3, Link as LinkIcon, Unlink, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface ProfileDropdownProps {
  testIdPrefix?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ProfileDropdown({ testIdPrefix = "", onOpenChange }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationType, setAnimationType] = useState<'enter' | 'exit'>('enter')
  
  // Helper function to update open state and notify parent
  const updateOpenState = useCallback((newIsOpen: boolean) => {
    if (newIsOpen) {
      // Opening - trigger enter animation
      setAnimationType('enter')
      setIsOpen(true)
      setIsAnimating(true)
      setTimeout(() => {
        setIsAnimating(false)
      }, 200) // Match animation duration
    } else if (isOpen) {
      // Closing - trigger exit animation
      setAnimationType('exit')
      setIsAnimating(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsAnimating(false)
      }, 200) // Match animation duration
    }
    onOpenChange?.(newIsOpen)
  }, [onOpenChange, isOpen])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarCheckLoading, setCalendarCheckLoading] = useState(true)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
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
      setShowCalendarModal(false)
      
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
      setShowCalendarModal(false)

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
        className="flex items-center p-2 bg-muted hover:bg-accent rounded-lg transition-colors"
        data-testid={`${testIdPrefix}profile-dropdown-button`}
        aria-label={`Profile menu for ${getUserDisplayName()}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Dropdown Menu */}
      {(isOpen || isAnimating) && (
        <div 
          className="absolute right-0 top-full mt-2 w-max min-w-56 max-w-80 rounded-lg shadow-lg bg-card border border-border py-2 z-50"
          style={{
            animation: animationType === 'enter' ? 'fadeInScale 200ms ease-out forwards' : 'scaleOutFade 200ms ease-out forwards'
          }}
          data-testid="profile-dropdown-menu"
          role="menu"
          aria-label="Profile menu"
        >
          <div className="px-4 py-2 border-b border-border" data-testid="profile-info-section">
            <p className="text-sm font-medium text-foreground whitespace-nowrap" data-testid="profile-name">{getUserDisplayName()}</p>
            <p className="text-xs font-normal text-muted-foreground whitespace-nowrap" title={user.email} data-testid="profile-email">{user.email}</p>
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
          <button
            onClick={() => setShowCalendarModal(true)}
            disabled={calendarLoading}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            data-testid="calendar-toggle-button"
            aria-label={calendarConnected ? 'Manage Google Calendar connection' : 'Manage Google Calendar connection'}
            title={calendarConnected ? 'Manage Google Calendar connection' : 'Manage Google Calendar connection'}
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Google Calendar</span>
            {calendarCheckLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" data-testid="calendar-status-loading" />
            ) : (
              <>
                {calendarConnected ? (
                  <LinkIcon className="w-3 h-3 text-green-600 -translate-y-0.5" data-testid="calendar-connected-icon" />
                ) : (
                  <Unlink className="w-3 h-3 text-amber-500 -translate-y-0.5" data-testid="calendar-disconnected-icon" />
                )}
              </>
            )}
          </button>

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

      {/* Google Calendar Modal */}
      {showCalendarModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={() => setShowCalendarModal(false)}
        >
          <div 
            className="bg-card rounded-lg shadow-xl border border-border p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-medium text-foreground">
                Google Calendar
              </h3>
            </div>
            
            <div className="space-y-4">
              {calendarConnected ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LinkIcon className="w-4 h-4 text-green-600" />
                    <span>Your Google Calendar is currently connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Events you RSVP to will automatically be added to your Google Calendar.
                  </p>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCalendarDisconnect}
                      disabled={calendarLoading}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {calendarLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Unlink className="w-4 h-4" />
                          Disconnect
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowCalendarModal(false)}
                      className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Unlink className="w-4 h-4 text-amber-500" />
                    <span>Your Google Calendar is not connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect your Google Calendar to automatically add events you RSVP to.
                  </p>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCalendarConnect}
                      disabled={calendarLoading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {calendarLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowCalendarModal(false)}
                      className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 