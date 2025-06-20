'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

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
  clearStaleAuthData: () => Promise<void>
  // Feature flags
  isGoogleAuthEnabled: boolean
  isAppleAuthEnabled: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Reduced timeout to ensure loading state is resolved quickly for optimistic UI
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 1000) // Reduced timeout for faster optimistic UI response

    // Get initial session immediately
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting initial session:', error)
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Unexpected error getting initial session:', error)
        setSession(null)
        setUser(null)
        setLoading(false)
      }
    }

    // Start session loading immediately
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        } catch (error) {
          console.error('Error in auth state change:', error)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase.auth])

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
    
    // Clear any potential stale auth data from localStorage/sessionStorage
    try {
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (storageError) {
      console.warn('Failed to clear client storage:', storageError)
    }
    
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    if (!ENABLE_GOOGLE_AUTH) {
      throw new Error('Google authentication is currently disabled')
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signInWithApple = async () => {
    throw new Error('Apple authentication is coming soon! An Apple Developer account is required.')
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    })
    if (error) throw error
  }

  const clearStaleAuthData = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      })
      
      // Reset auth state
      setUser(null)
      setSession(null)
      setLoading(false)
      
      console.log('🧹 Cleared all stale auth data')
    } catch (error) {
      console.error('❌ Failed to clear stale auth data:', error)
    }
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
    clearStaleAuthData,
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