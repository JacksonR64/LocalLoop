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

                console.log('📊 OAuth callback parameters:', {
                    hasCode: !!code,
                    hasError: !!error,
                    error: error,
                    errorDescription: errorDescription,
                    codePrefix: code ? code.substring(0, 10) + '...' : 'none'
                })

                // Handle OAuth errors from provider
                if (error) {
                    console.error('❌ OAuth provider error:', { error, errorDescription })
                    router.replace('/auth/login?error=access_denied')
                    return
                }

                // Handle missing authorization code
                if (!code) {
                    console.error('❌ No authorization code in callback')
                    router.replace('/auth/login?error=no_code')
                    return
                }

                // Get return URL from session storage
                const returnUrl = typeof window !== 'undefined'
                    ? sessionStorage.getItem('authReturnUrl') || '/'
                    : '/'

                console.log('🔄 Exchanging authorization code for session...')
                console.log('📍 Return URL will be:', returnUrl)

                // Add timeout wrapper around the code exchange
                const exchangePromise = supabase.auth.exchangeCodeForSession(code)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OAuth exchange timeout')), 8000)
                )

                const { data, error: exchangeError } = await Promise.race([
                    exchangePromise,
                    timeoutPromise
                ]) as any

                console.log('📊 Code exchange result:', {
                    hasSession: !!data?.session,
                    hasUser: !!data?.user,
                    hasError: !!exchangeError,
                    error: exchangeError?.message,
                    userId: data?.user?.id?.substring(0, 8) + '...' || 'none'
                })

                if (exchangeError) {
                    console.error('❌ Error exchanging code for session:', exchangeError)
                    router.replace('/auth/login?error=exchange_failed')
                    return
                }

                if (!data?.session) {
                    console.error('❌ No session returned from code exchange')
                    router.replace('/auth/login?error=no_session')
                    return
                }

                // Clear return URL from session storage
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('authReturnUrl')
                }

                console.log('✅ OAuth authentication successful! Redirecting to:', returnUrl)

                // Small delay to ensure session is fully established
                setTimeout(() => {
                    router.replace(returnUrl)
                }, 100)

            } catch (error) {
                console.error('💥 Unexpected error in OAuth callback:', error)

                // Handle timeout specifically
                if (error instanceof Error && error.message === 'OAuth exchange timeout') {
                    console.error('⏰ OAuth code exchange timed out after 8 seconds')
                    router.replace('/auth/login?error=timeout')
                } else {
                    router.replace('/auth/login?error=callback_failed')
                }
            }
        }

        // Add overall timeout as backup
        const callbackTimeout = setTimeout(() => {
            console.error('🚨 OAuth callback process timed out completely')
            router.replace('/auth/login?error=callback_timeout')
        }, 10000)

        handleAuthCallback().finally(() => {
            clearTimeout(callbackTimeout)
        })

    }, [router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <h2 className="text-xl font-semibold text-foreground">
                    Completing authentication...
                </h2>
                <p className="text-muted-foreground">
                    Processing your login, please wait
                </p>
            </div>
        </div>
    )
} 