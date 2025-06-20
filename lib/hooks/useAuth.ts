// Client-side authentication hook for LocalLoop
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'user' | 'organizer' | 'admin'

export interface AuthUser {
    id: string
    email: string
    display_name?: string
    role: UserRole
    google_calendar_connected?: boolean
}

export interface UseAuthReturn {
    user: AuthUser | null
    loading: boolean
    error: string | null
    isAuthenticated: boolean
    isStaff: boolean
    isAdmin: boolean
    isOrganizer: boolean
    refresh: () => Promise<void>
    signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchUserProfile = useCallback(async (authUser: User) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role, display_name, google_calendar_connected')
                .eq('id', authUser.id)
                .single()

            if (error) {
                // Don't treat missing user as a hard error - they might not be in the users table yet
                if (error.code === 'PGRST116') {
                    // No rows returned - user doesn't exist in users table yet
                    // Return default user object without logging error to prevent console spam
                    return {
                        id: authUser.id,
                        email: authUser.email || '',
                        display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name,
                        role: 'user' as UserRole, // Default role
                        google_calendar_connected: false
                    }
                }
                console.error('Error fetching user profile:', error)
                setError('Failed to load user profile')
                return null
            }

            return {
                id: authUser.id,
                email: authUser.email || '',
                display_name: data.display_name || authUser.user_metadata?.display_name,
                role: data.role as UserRole,
                google_calendar_connected: data.google_calendar_connected || false
            }
        } catch (err) {
            console.error('Error in fetchUserProfile:', err)
            setError('Failed to load user profile')
            return null
        }
    }, [supabase])

    const refresh = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError) {
                // Only log actual errors, not missing sessions
                if (authError.message !== 'Auth session missing!') {
                    console.error('Auth error:', authError)
                    setError('Authentication failed')
                }
                setUser(null)
                return
            }

            if (!authUser) {
                setUser(null)
                return
            }

            const userProfile = await fetchUserProfile(authUser)
            setUser(userProfile)
        } catch (err) {
            // Only log unexpected errors, not auth session missing errors
            if (err instanceof Error && !err.message.includes('Auth session missing')) {
                console.error('Error refreshing auth:', err)
                setError('Failed to refresh authentication')
            }
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [fetchUserProfile])

    const signOut = useCallback(async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Sign out error:', error)
                setError('Failed to sign out')
            } else {
                setUser(null)
                window.location.href = '/'
            }
        } catch (err) {
            console.error('Error signing out:', err)
            setError('Failed to sign out')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Get initial session
        refresh()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session?.user) {
                        const userProfile = await fetchUserProfile(session.user)
                        setUser(userProfile)
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [refresh, fetchUserProfile])

    const isAuthenticated = !!user
    const isStaff = user ? ['organizer', 'admin'].includes(user.role) : false
    const isAdmin = user?.role === 'admin'
    const isOrganizer = user ? ['organizer', 'admin'].includes(user.role) : false

    return {
        user,
        loading,
        error,
        isAuthenticated,
        isStaff,
        isAdmin,
        isOrganizer,
        refresh,
        signOut
    }
} 