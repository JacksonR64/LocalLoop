'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, ChevronDown, Settings, Calendar, BarChart3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
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
      console.log('🚪 ProfileDropdown: Starting sign out...')
      setIsOpen(false)

      // Use the main auth context signOut method
      await signOut()

      console.log('✅ ProfileDropdown: Sign out completed')
    } catch (error) {
      console.error('❌ ProfileDropdown: Error signing out:', error)

      // Even if signOut fails, force a page reload to clear state
      if (typeof window !== 'undefined') {
        console.log('🔄 ProfileDropdown: Forcing page reload to clear auth state')
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
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-muted hover:bg-accent px-3 py-2 rounded-lg transition-colors"
      >
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{getUserDisplayName()}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-2 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{getUserDisplayName()}</p>
            <p className="text-xs text-muted-foreground truncate" title={user.email}>{user.email}</p>
            {userProfile?.role && (
              <p className="text-xs text-primary capitalize font-medium mt-1">
                {userProfile.role}
              </p>
            )}
          </div>

          {/* My Events Link */}
          <Link
            href="/my-events"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Calendar className="w-4 h-4" />
            My Events
          </Link>

          {/* Staff Dashboard Link - Only for organizers and admins */}
          {isStaff && (
            <Link
              href="/staff"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {isAdmin ? <Settings className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
            </Link>
          )}

          <div className="border-t border-border my-1" />

          {/* Google Calendar Connection */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Google Calendar</span>
              </div>
              
              {calendarCheckLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2">
                  {calendarConnected ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <button
                        onClick={handleCalendarDisconnect}
                        disabled={calendarLoading}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {calendarLoading ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <button
                        onClick={handleCalendarConnect}
                        disabled={calendarLoading}
                        className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
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
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
} 