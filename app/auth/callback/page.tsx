'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering to prevent pre-rendering issues
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Processing authentication...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                console.log('🔍 Processing OAuth callback...')
                setStatus('Processing authentication...')

                // Get the authorization code from URL parameters
                const code = searchParams.get('code')
                const error = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')

                // Check for OAuth errors first
                if (error) {
                    console.error('❌ OAuth error:', { error, errorDescription })
                    setError(`OAuth error: ${error}`)
                    setTimeout(() => {
                        router.push(`/auth/login?error=${encodeURIComponent(error)}`)
                    }, 2000)
                    return
                }

                // Check if we have the authorization code
                if (!code) {
                    console.error('❌ No authorization code found in callback URL')
                    setError('No authorization code received')
                    setTimeout(() => {
                        router.push('/auth/login?error=no_code')
                    }, 2000)
                    return
                }

                console.log('🔄 Exchanging authorization code for session...')
                setStatus('Exchanging authorization code for session...')

                // Add timeout to prevent hanging
                const exchangePromise = supabase.auth.exchangeCodeForSession(code)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Exchange timeout')), 15000)
                )

                const { data, error: exchangeError } = await Promise.race([
                    exchangePromise,
                    timeoutPromise
                ]) as any

                if (exchangeError) {
                    console.error('❌ Code exchange error:', exchangeError)
                    setError(`Authentication failed: ${exchangeError.message}`)
                    setTimeout(() => {
                        router.push('/auth/login?error=exchange_failed')
                    }, 2000)
                    return
                }

                if (data?.session && data?.user) {
                    console.log('✅ Authentication successful:', {
                        userId: data.user.id,
                        email: data.user.email,
                        provider: data.user.app_metadata?.provider
                    })

                    setStatus('Authentication successful! Redirecting...')

                    // Get the return URL from session storage or default to home
                    const returnUrl = sessionStorage.getItem('returnUrl') || '/'
                    sessionStorage.removeItem('returnUrl') // Clean up

                    console.log('🏠 Redirecting to:', returnUrl)

                    // Give a moment for the state to update, then redirect
                    setTimeout(() => {
                        router.push(returnUrl)
                    }, 1000)
                } else {
                    console.error('❌ No session created after code exchange')
                    setError('Authentication failed - no session created')
                    setTimeout(() => {
                        router.push('/auth/login?error=no_session')
                    }, 2000)
                }
            } catch (error: any) {
                console.error('💥 Unexpected error in auth callback:', error)
                setError(`Unexpected error: ${error.message}`)
                setTimeout(() => {
                    router.push('/auth/login?error=unexpected_error')
                }, 2000)
            }
        }

        handleAuthCallback()
    }, [router, searchParams])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-xl mb-4">❌</div>
                    <h1 className="text-xl font-semibold mb-2">Authentication Error</h1>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{status}</p>
                <p className="mt-2 text-sm text-muted-foreground">Please wait while we complete your authentication...</p>
            </div>
        </div>
    )
}

// Loading fallback component
function AuthCallbackLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading authentication...</p>
            </div>
        </div>
    )
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<AuthCallbackLoading />}>
            <AuthCallbackContent />
        </Suspense>
    )
} 