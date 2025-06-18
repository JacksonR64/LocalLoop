'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Feature toggles for authentication providers
const ENABLE_GOOGLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== 'false'
const ENABLE_APPLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === 'true'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<void>
    signInWithApple: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    updatePassword: (password: string) => Promise<void>
    // Feature flags
    isGoogleAuthEnabled: boolean
    isAppleAuthEnabled: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('🔥 AuthProvider useEffect started')

        // Get initial session immediately
        const getInitialSession = async () => {
            console.log('🔍 Getting initial session...')
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                console.log('📊 Initial session result:', {
                    hasSession: !!session,
                    hasError: !!error,
                    error: error?.message,
                    user: session?.user?.email
                })

                if (error) {
                    console.error('❌ Error getting initial session:', error)
                }

                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
                console.log('✅ Initial session loaded successfully')
            } catch (error) {
                console.error('💥 Unexpected error getting initial session:', error)
                setSession(null)
                setUser(null)
                setLoading(false)
            }
        }

        // Start session loading immediately
        getInitialSession()

        // Reduced timeout to ensure loading state is resolved quickly for optimistic UI
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('⏰ Auth initialization timeout - resolving loading state')
                setLoading(false)
            }
        }, 1000) // Reduced timeout for faster optimistic UI response

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 Auth state change:', { event, hasSession: !!session })
                try {
                    setSession(session)
                    setUser(session?.user ?? null)
                    setLoading(false)
                } catch (error) {
                    console.error('❌ Error in auth state change:', error)
                    setLoading(false)
                }
            }
        )

        return () => {
            console.log('🧹 AuthProvider cleanup')
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
    }

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) throw error
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    const signInWithGoogle = async () => {
        console.log('🚀 [OAuth Debug] Google Sign-In initiated')

        if (!ENABLE_GOOGLE_AUTH) {
            throw new Error('Google authentication is currently disabled')
        }

        // Store current URL as return URL (but not if we're already on auth pages)
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            if (!currentPath.startsWith('/auth/')) {
                sessionStorage.setItem('returnUrl', currentPath)
                console.log('📍 [OAuth Debug] Stored return URL:', currentPath)
            }
        }

        // Log storage state before OAuth
        console.log('🔍 [OAuth Debug] Storage state before OAuth:', {
            sessionStorageKeys: typeof window !== 'undefined' ? Object.keys(sessionStorage) : [],
            localStorageKeys: typeof window !== 'undefined' ? Object.keys(localStorage).filter(k =>
                k.includes('supabase') || k.includes('sb-') || k.includes('auth')
            ) : []
        })

        try {
            console.log('🔄 [OAuth Debug] Calling supabase.auth.signInWithOAuth...')

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                }
            })

            console.log('📊 [OAuth Debug] OAuth response:', {
                hasData: !!data,
                hasUrl: !!data?.url,
                hasProvider: !!data?.provider,
                hasError: !!error,
                error: error?.message,
                urlPreview: data?.url ? data.url.substring(0, 100) + '...' : 'none'
            })

            // Check if PKCE storage was created after OAuth call
            console.log('🔍 [OAuth Debug] Storage state after OAuth call:', {
                hasCodeVerifier: !!(
                    sessionStorage.getItem('supabase.auth.code_verifier') ||
                    localStorage.getItem('supabase.auth.code_verifier') ||
                    sessionStorage.getItem('sb-auth-code-verifier') ||
                    localStorage.getItem('sb-auth-code-verifier')
                ),
                sessionStorageKeys: Object.keys(sessionStorage),
                localStorageKeys: Object.keys(localStorage).filter(k =>
                    k.includes('supabase') || k.includes('sb-') || k.includes('auth')
                ),
                supabaseAuthKeys: Object.keys(localStorage).filter(k => k.startsWith('sb-'))
            })

            if (error) {
                console.error('❌ [OAuth Debug] OAuth initiation error:', error)
                throw error
            }

            if (!data?.url) {
                console.error('❌ [OAuth Debug] No OAuth URL returned')
                throw new Error('Failed to get OAuth URL from Supabase')
            }

            console.log('✅ [OAuth Debug] OAuth URL generated, redirecting...')

            // The redirect happens automatically, but let's log it
            setTimeout(() => {
                console.log('🔍 [OAuth Debug] Final storage check before redirect:', {
                    allKeys: Object.keys(localStorage).concat(Object.keys(sessionStorage)),
                    supabaseKeys: Object.keys(localStorage).filter(k => k.includes('supabase')),
                    authKeys: Object.keys(localStorage).filter(k => k.includes('auth'))
                })
            }, 100)

        } catch (error: any) {
            console.error('💥 [OAuth Debug] signInWithGoogle error:', error)
            throw error
        }
    }

    const signInWithApple = async () => {
        if (!ENABLE_APPLE_AUTH) {
            throw new Error('Apple authentication is coming soon! An Apple Developer account is required.')
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/update-password`,
        })
        if (error) throw error
    }

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({
            password,
        })
        if (error) throw error
    }

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithApple,
        resetPassword,
        updatePassword,
        isGoogleAuthEnabled: ENABLE_GOOGLE_AUTH,
        isAppleAuthEnabled: ENABLE_APPLE_AUTH,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
} 