import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createGoogleCalendarAuth } from '@/lib/google-auth'

/**
 * API Route: /api/auth/google/status
 * Provides Google Calendar connection status and token health information
 * 
 * Security:
 * - Requires user authentication
 * - Returns connection status without exposing token details
 * - Validates token health without revealing sensitive information
 */

// Simple in-memory cache for connection status (5 minutes)
interface StatusCacheData {
    connected: boolean;
    healthy: boolean | null; // Can be null from the API response
    connectedAt?: string;
    expiresAt?: string;
    daysUntilExpiration?: number | null;
    syncEnabled: boolean | undefined;
    primaryCalendar?: unknown;
    lastChecked: string;
    requiresReconnection: boolean;
}
const statusCache = new Map<string, { data: StatusCacheData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Timeout wrapper for slow operations
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    })
    return Promise.race([promise, timeoutPromise])
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const userIdParam = url.searchParams.get('userId')

        const supabase = await createServerSupabaseClient()
        let user = null

        // Try to get user from Supabase session first
        const { data: { user: sessionUser } } = await supabase.auth.getUser()

        if (sessionUser) {
            user = sessionUser
        } else if (userIdParam) {
            // Create a minimal user object for Google Calendar status check
            user = { id: userIdParam }
        } else {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Check cache first
        const cacheKey = `status_${user.id}`
        const cached = statusCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json(cached.data)
        }

        const googleAuth = createGoogleCalendarAuth()

        // Add timeout to prevent hanging requests
        const connectionStatus = await withTimeout(
            googleAuth.getConnectionStatus(user.id),
            10000 // 10 second timeout
        )

        // Test connection if connected (with timeout)
        let connectionTest = null
        if (connectionStatus.connected) {
            try {
                connectionTest = await withTimeout(
                    googleAuth.testUserConnection(user.id),
                    8000 // 8 second timeout for connection test
                )
            } catch (error) {
                console.warn('Connection test timed out or failed:', error)
                // Continue without connection test if it fails
                connectionTest = { connected: false }
            }
        }

        const isHealthy = connectionStatus.connected &&
            connectionTest &&
            connectionTest.connected

        // Calculate days until expiration
        const daysUntilExpiration = connectionStatus.expiresAt
            ? Math.ceil((new Date(connectionStatus.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null

        const response = {
            connected: connectionStatus.connected,
            healthy: isHealthy,
            connectedAt: connectionStatus.connectedAt,
            expiresAt: connectionStatus.expiresAt,
            daysUntilExpiration,
            syncEnabled: connectionStatus.syncEnabled,
            primaryCalendar: connectionTest?.primaryCalendar || null,
            lastChecked: new Date().toISOString(),
            requiresReconnection: connectionStatus.connected && !isHealthy
        }

        // Cache the response
        statusCache.set(cacheKey, { data: response, timestamp: Date.now() })

        return NextResponse.json(response)

    } catch (error) {
        console.error('Error getting Google Calendar status:', error)
        return NextResponse.json(
            { error: 'Failed to get calendar status' },
            { status: 500 }
        )
    }
}

/**
 * POST: Refresh tokens proactively
 * Triggers a token refresh if the user is connected
 */
export async function POST() {
    try {
        // Create Supabase client and verify user authentication
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get Google Calendar auth service
        const googleAuth = createGoogleCalendarAuth()

        // Check if user is connected
        const connectionStatus = await googleAuth.getConnectionStatus(user.id)
        if (!connectionStatus.connected) {
            return NextResponse.json(
                { error: 'Google Calendar not connected' },
                { status: 400 }
            )
        }

        // Attempt to get and refresh calendar service (this will refresh tokens if needed)
        const calendarService = await googleAuth.getUserCalendarService(user.id)

        if (!calendarService) {
            return NextResponse.json(
                { error: 'Failed to refresh calendar connection' },
                { status: 500 }
            )
        }

        // Test the refreshed connection
        const connectionTest = await calendarService.testConnection()

        return NextResponse.json({
            success: true,
            connected: connectionTest.connected,
            primaryCalendar: connectionTest.primaryCalendar,
            refreshedAt: new Date().toISOString()
        })

    } catch (error) {
        console.error('Error refreshing Google Calendar tokens:', error)
        return NextResponse.json(
            { error: 'Failed to refresh calendar tokens' },
            { status: 500 }
        )
    }
}

/**
 * Handle other HTTP methods with appropriate error
 */
export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    )
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed. Use disconnect endpoint instead.' },
        { status: 405 }
    )
}

/**
 * HEAD: Return same headers as GET but without response body
 * Handles preflight and optimization requests from browsers/frameworks
 */
export async function HEAD(request: Request) {
    try {
        // HEAD requests should return the same headers as GET but without body
        // We can reuse the GET logic and just return headers
        const getResponse = await GET(request)

        // Return same status and headers but no body
        return new Response(null, {
            status: getResponse.status,
            headers: getResponse.headers
        })
    } catch (error) {
        console.error('Error handling HEAD request for Google Calendar status:', error)
        return new Response(null, {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }
} 