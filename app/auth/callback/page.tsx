'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering to prevent pre-rendering issues
export const dynamic = 'force-dynamic'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                console.log('🔍 Processing OAuth callback...')

                // Get the authorization code from URL parameters
                const code = searchParams.get('code')
                const error = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')

                // Check for OAuth errors first
                if (error) {
                    console.error('OAuth error:', { error, errorDescription })
                    router.push(`/auth/login?error=${encodeURIComponent(error)}`)
                    return
                }

                // Check if we have the authorization code
                if (!code) {
                    console.error('No authorization code found in callback URL')
                    router.push('/auth/login?error=no_code')
                    return
                }

                console.log('🔄 Exchanging authorization code for session...')

                // Exchange the authorization code for a session
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                if (exchangeError) {
                    console.error('Code exchange error:', exchangeError)
                    router.push('/auth/login?error=exchange_failed')
                    return
                }

                if (data.session && data.user) {
                    console.log('✅ Authentication successful:', {
                        userId: data.user.id,
                        email: data.user.email,
                        provider: data.user.app_metadata?.provider
                    })

                    // Get the return URL from session storage or default to home
                    const returnUrl = sessionStorage.getItem('returnUrl') || '/'
                    sessionStorage.removeItem('returnUrl') // Clean up

                    console.log('🏠 Redirecting to:', returnUrl)
                    router.push(returnUrl)
                } else {
                    console.error('No session created after code exchange')
                    router.push('/auth/login?error=no_session')
                }
            } catch (error) {
                console.error('Unexpected error in auth callback:', error)
                router.push('/auth/login?error=unexpected_error')
            }
        }

        handleAuthCallback()
    }, [router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Completing authentication...</p>
                <p className="mt-2 text-sm text-muted-foreground">Please wait while we sign you in</p>
            </div>
        </div>
    )
} 