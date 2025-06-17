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

                // Handle OAuth errors from provider
                if (error) {
                    console.error('❌ OAuth provider error:', { error, errorDescription })
                    router.replace(`/auth/login?error=${encodeURIComponent(error)}`)
                    return
                }

                // Ensure we have an authorization code
                if (!code) {
                    console.error('❌ No authorization code provided')
                    router.replace('/auth/login?error=no_code')
                    return
                }

                console.log('✅ Authorization code received, exchanging for session...')

                // Create a promise for the OAuth exchange with retry logic
                const exchangeCodeWithRetry = async (retries = 2): Promise<any> => {
                    for (let attempt = 0; attempt <= retries; attempt++) {
                        try {
                            console.log(`🔄 OAuth exchange attempt ${attempt + 1}/${retries + 1}`)

                            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                            if (error) {
                                console.error(`❌ OAuth exchange error (attempt ${attempt + 1}):`, error)
                                if (attempt === retries) throw error
                                // Wait before retry
                                await new Promise(resolve => setTimeout(resolve, 1000))
                                continue
                            }

                            console.log('✅ OAuth exchange successful:', {
                                hasSession: !!data.session,
                                hasUser: !!data.user,
                                userEmail: data.user?.email
                            })
                            return data
                        } catch (err) {
                            console.error(`💥 OAuth exchange failed (attempt ${attempt + 1}):`, err)
                            if (attempt === retries) throw err
                            // Wait before retry
                            await new Promise(resolve => setTimeout(resolve, 1000))
                        }
                    }
                }

                // Set up timeout with longer duration (20 seconds)
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('OAuth exchange timeout'))
                    }, 20000) // Increased to 20 seconds
                })

                // Race between OAuth exchange and timeout
                const data = await Promise.race([
                    exchangeCodeWithRetry(),
                    timeoutPromise
                ])

                if (data && data.session) {
                    console.log('🎉 Authentication successful! Redirecting...')

                    // Get return URL from session storage or default to home
                    const returnUrl = sessionStorage.getItem('authReturnUrl') || '/'
                    sessionStorage.removeItem('authReturnUrl')

                    console.log('📍 Redirecting to:', returnUrl)

                    // Small delay to ensure session is fully established
                    setTimeout(() => {
                        router.replace(returnUrl)
                    }, 500)
                } else {
                    console.error('❌ No session data received')
                    router.replace('/auth/login?error=no_session')
                }

            } catch (error: any) {
                console.error('💥 OAuth callback error:', error)

                // Handle specific error types
                if (error.message === 'OAuth exchange timeout') {
                    console.warn('⏰ OAuth code exchange timed out after 20 seconds')
                    router.replace('/auth/login?error=timeout')
                } else if (error.message?.includes('Invalid')) {
                    console.error('🔑 Invalid authorization code')
                    router.replace('/auth/login?error=invalid_code')
                } else {
                    console.error('🚫 General OAuth error')
                    router.replace('/auth/login?error=auth_failed')
                }
            }
        }

        // Only run callback handling if we have URL parameters
        if (searchParams.toString()) {
            handleAuthCallback().catch((err) => {
                console.error('🚨 Unhandled OAuth callback error:', err)
                router.replace('/auth/login?error=callback_failed')
            })
        } else {
            // No parameters, redirect to login
            console.log('ℹ️ No OAuth parameters, redirecting to login')
            router.replace('/auth/login')
        }
    }, [router, searchParams])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <h2 className="text-lg font-semibold text-foreground">
                    Completing authentication...
                </h2>
                <p className="text-sm text-muted-foreground">
                    Please wait while we finish setting up your account.
                </p>
            </div>
        </div>
    )
} 