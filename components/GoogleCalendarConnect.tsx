'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { EventData } from '@/components/events/EventCard'
// import { useRouter } from 'next/navigation' // Will be used when disconnect functionality is implemented

/**
 * Hook to handle OAuth callback parameters and show success/error messages
 */
function useOAuthCallback() {
    const searchParams = useSearchParams()
    const [callbackMessage, setCallbackMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        const success = searchParams.get('success')
        const error = searchParams.get('error')
        const action = searchParams.get('action')

        if (success === 'true') {
            setCallbackMessage({
                type: 'success',
                message: action === 'create_event' ? 'Google Calendar connected! You can now add events to your calendar.' : 'Google Calendar connected successfully!'
            })
        } else if (error) {
            setCallbackMessage({
                type: 'error',
                message: 'Failed to connect Google Calendar. Please try again.'
            })
        }

        // Clear message after 5 seconds
        if (success || error) {
            const timer = setTimeout(() => setCallbackMessage(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [searchParams])

    return callbackMessage
}

/**
 * Hook to fetch Google Calendar connection status
 */
function useGoogleCalendarStatus() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const checkStatus = async () => {
        try {
            // Extract user ID from OAuth callback URL parameters
            const urlParams = new URLSearchParams(window.location.search)
            const userIdFromUrl = urlParams.get('userId')
            const oauthSuccess = urlParams.get('success') === 'true'

            // Build API URL with user ID if available
            let apiUrl = '/api/auth/google/status'
            if (userIdFromUrl) {
                apiUrl += `?userId=${userIdFromUrl}`
            }

            const response = await fetch(apiUrl, {
                method: 'GET',
                credentials: 'include', // This ensures cookies are sent with the request
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setIsConnected(data.connected || false)
            } else if (response.status === 401) {
                // Authentication required - this is expected if user isn't logged into Supabase
                if (oauthSuccess) {
                    setIsConnected(true)
                } else {
                    setIsConnected(false)
                }
            } else {
                setIsConnected(false)
            }
        } catch (error) {
            console.error('Error checking Google Calendar status:', error)
            setIsConnected(false)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        checkStatus()
    }, [])

    return { isConnected, isLoading, refresh: checkStatus }
}

/**
 * Google Calendar Connection Component
 * Provides UI for connecting/disconnecting Google Calendar
 * Shows connection status and handles OAuth flow initiation
 */

export interface GoogleCalendarConnectProps {
    /** Current user's Google Calendar connection status */
    isConnected?: boolean
    /** Action context for OAuth flow */
    action?: 'connect' | 'create_event' | 'sync'
    /** URL to return to after OAuth completion */
    returnUrl?: string
    /** Additional CSS classes */
    className?: string
    /** Callback when connection status changes */
    onStatusChange?: (connected: boolean) => void
    eventData?: EventData // Add eventData prop for passing event information
}

export default function GoogleCalendarConnect({
    isConnected = false,
    action = 'connect',
    returnUrl,
    className = '',
    onStatusChange,  
    eventData
}: GoogleCalendarConnectProps) {
    // const router = useRouter() // Will be used in disconnect functionality later
    const [isLoading, setIsLoading] = useState(false)
    const [localConnected, setLocalConnected] = useState(isConnected)
    const callbackMessage = useOAuthCallback()

    // Update local state when prop changes
    useEffect(() => {
        setLocalConnected(isConnected)
    }, [isConnected])

    const handleConnect = async () => {
        try {
            setIsLoading(true)

            // Build OAuth initiation URL with parameters
            const params = new URLSearchParams({
                action,
                ...(returnUrl && { returnUrl })
            })

            // Redirect to OAuth initiation endpoint
            const connectUrl = `/api/auth/google/connect?${params.toString()}`
            window.location.href = connectUrl

        } catch (error) {
            console.error('Error initiating Google Calendar connection:', error)
            setIsLoading(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            setIsLoading(true)

            const response = await fetch('/api/auth/google/disconnect', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (response.ok) {
                setLocalConnected(false)
                onStatusChange?.(false)
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
            setIsLoading(false)
        }
    }

    const getActionText = () => {
        switch (action) {
            case 'create_event':
                return 'Add to Calendar'
            case 'sync':
                return 'Enable Calendar Sync'
            case 'connect':
            default:
                return 'Connect Google Calendar'
        }
    }

    const getStatusText = () => {
        if (localConnected) {
            switch (action) {
                case 'create_event':
                    return 'Calendar connected'
                case 'sync':
                    return 'Calendar sync active'
                case 'connect':
                default:
                    return 'Google Calendar connected'
            }
        }
        return 'Not connected'
    }

    return (
        <div className={`p-4 border rounded-lg ${className}`}>
            {/* Success/Error Messages */}
            {callbackMessage && (
                <div className={`mb-4 p-3 rounded-md ${callbackMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <div className="flex">
                        {callbackMessage.type === 'success' ? (
                            <CheckCircle className="w-4 h-4 mr-2 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5" />
                        )}
                        <span className="text-sm">{callbackMessage.message}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Google Calendar</span>
                    </div>

                    <div className="flex items-center space-x-1">
                        {localConnected ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">{getStatusText()}</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span className="text-sm text-gray-500">{getStatusText()}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    {localConnected ? (
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                            {action === 'create_event' && (
                                <button
                                    onClick={async () => {
                                        if (!eventData) {
                                            alert('Event data is not available. Please refresh the page and try again.')
                                            return
                                        }

                                        try {
                                            const response = await fetch('/api/calendar/create-event', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                credentials: 'include', // Important: include cookies for Supabase session
                                                body: JSON.stringify({
                                                    eventData: {
                                                        id: eventData.id,
                                                        title: eventData.title,
                                                        description: eventData.description,
                                                        start_time: eventData.start_time,
                                                        end_time: eventData.end_time,
                                                        location: eventData.location
                                                    }
                                                }),
                                            })

                                            if (response.ok) {
                                                alert('Event successfully added to your Google Calendar!')
                                            } else {
                                                const error = await response.json()
                                                console.error('Failed to create calendar event:', error)

                                                if (response.status === 401) {
                                                    alert('Please log in and connect your Google Calendar to add events.')
                                                } else if (error.error && error.error.includes('reconnect')) {
                                                    alert('Google Calendar access has expired. Please disconnect and reconnect your calendar.')
                                                } else {
                                                    alert(`Failed to add event to calendar: ${error.error || 'Unknown error'}`)
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Error creating calendar event:', error)
                                            alert('An error occurred while adding the event to your calendar. Please try again.')
                                        }
                                    }}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                                >
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">Add to Calendar</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            )}
                            <button
                                onClick={handleDisconnect}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-1">
                                        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                                        <span className="hidden sm:inline">Disconnecting...</span>
                                        <span className="sm:hidden">...</span>
                                    </div>
                                ) : (
                                    'Disconnect'
                                )}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-1">
                                    <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                                    <span className="hidden sm:inline">{getActionText().replace('Connect', 'Connecting...')}</span>
                                    <span className="sm:hidden">...</span>
                                </div>
                            ) : (
                                getActionText()
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Additional context based on action */}
            {action === 'create_event' && !localConnected && (
                <p className="mt-2 text-xs text-gray-500">
                    Connect your Google Calendar to add this event directly to your calendar
                </p>
            )}

            {action === 'sync' && (
                <p className="mt-2 text-xs text-gray-500">
                    Synchronizes your LocalLoop events with your Google Calendar
                </p>
            )}

            {action === 'connect' && (
                <p className="mt-2 text-xs text-gray-500">
                    Connect your Google Calendar to enable event management and one-click calendar additions
                </p>
            )}
        </div>
    )
}

/**
 * Wrapper component that fetches and manages Google Calendar connection status
 */
export function GoogleCalendarConnectWithStatus({
    action = 'connect',
    returnUrl,
    className = '',
    onStatusChange,
    eventData
}: Omit<GoogleCalendarConnectProps, 'isConnected'>) {
    const { isConnected, isLoading, refresh } = useGoogleCalendarStatus()
    const callbackMessage = useOAuthCallback()

    // Refresh status when OAuth success is detected
    useEffect(() => {
        if (callbackMessage?.type === 'success') {
            // Wait a moment for backend processing to complete, then refresh
            setTimeout(() => {
                refresh()
            }, 1000)
        }
    }, [callbackMessage, refresh])

    if (isLoading) {
        return (
            <div className={`p-4 border rounded-lg ${className}`}>
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">Checking Google Calendar connection...</span>
                </div>
            </div>
        )
    }

    return (
        <GoogleCalendarConnect
            isConnected={isConnected}
            action={action}
            returnUrl={returnUrl}
            className={className}
            onStatusChange={onStatusChange}
            eventData={eventData}
        />
    )
} 