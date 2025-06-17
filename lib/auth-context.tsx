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

        // Fallback timeout to ensure loading state is resolved
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('⏰ Auth initialization timeout - resolving loading state')
                setLoading(false)
            }
        }, 10000) // 10 second timeout

        // Get initial session
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
                    // Still set loading to false even if there's an error
                    setSession(null)
                    setUser(null)
                    setLoading(false)
                    return
                }

                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
                console.log('✅ Initial session loaded successfully')
            } catch (error) {
                console.error('💥 Unexpected error getting initial session:', error)
                // Ensure loading state is always resolved
                setSession(null)
                setUser(null)
                setLoading(false)
            }
        }

        getInitialSession()

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
        if (!ENABLE_GOOGLE_AUTH) {
            throw new Error('Google authentication is currently disabled')
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
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