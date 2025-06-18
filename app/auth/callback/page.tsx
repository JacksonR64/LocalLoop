'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering to prevent pre-rendering issues
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Initializing authentication...')
    const [error, setError] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<any[]>([])

    // Helper function to add debug info
    const addDebugInfo = (step: string, data: any) => {
        const timestamp = new Date().toISOString()
        const debugEntry = { timestamp, step, data }
        console.log(`🔍 [OAuth Debug] ${step}:`, data)
        setDebugInfo(prev => [...prev, debugEntry])
    }

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                addDebugInfo('CALLBACK_START', {
                    url: window.location.href,
                    searchParams: Object.fromEntries(searchParams.entries())
                })

                console.log('🔍 Processing OAuth callback...')
                setStatus('Processing authentication...')

                // Get all URL parameters for debugging
                const code = searchParams.get('code')
                const error = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')
                const state = searchParams.get('state')

                addDebugInfo('URL_PARAMS_EXTRACTED', {
                    hasCode: !!code,
                    codeLength: code?.length,
                    hasError: !!error,
                    error,
                    errorDescription,
                    hasState: !!state,
                    stateLength: state?.length
                })

                // Check for OAuth errors first
                if (error) {
                    addDebugInfo('OAUTH_ERROR_DETECTED', { error, errorDescription })
                    console.error('❌ OAuth error:', { error, errorDescription })
                    setError(`OAuth error: ${error}`)
                    setTimeout(() => {
                        router.push(`/auth/login?error=${encodeURIComponent(error)}`)
                    }, 2000)
                    return
                }

                // Check if we have the authorization code
                if (!code) {
                    addDebugInfo('NO_CODE_ERROR', {
                        allParams: Object.fromEntries(searchParams.entries()),
                        url: window.location.href
                    })
                    console.error('❌ No authorization code found in callback URL')
                    setError('No authorization code received')
                    setTimeout(() => {
                        router.push('/auth/login?error=no_code')
                    }, 2000)
                    return
                }

                addDebugInfo('CODE_VALIDATION_PASSED', {
                    codePreview: `${code.substring(0, 8)}...${code.substring(code.length - 8)}`,
                    codeLength: code.length
                })

                console.log('🔄 Exchanging authorization code for session...')
                setStatus('Exchanging authorization code for session...')

                // Check if we have any stored PKCE info in sessionStorage/localStorage
                const storedCodeVerifier = sessionStorage.getItem('supabase.auth.code_verifier') ||
                    localStorage.getItem('supabase.auth.code_verifier')
                const storedState = sessionStorage.getItem('supabase.auth.state') ||
                    localStorage.getItem('supabase.auth.state')

                addDebugInfo('PKCE_STORAGE_CHECK', {
                    hasStoredCodeVerifier: !!storedCodeVerifier,
                    hasStoredState: !!storedState,
                    sessionStorageKeys: Object.keys(sessionStorage),
                    localStorageKeys: Object.keys(localStorage).filter(k => k.includes('supabase'))
                })

                // Add timeout to prevent hanging
                const exchangePromise = supabase.auth.exchangeCodeForSession(code)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Exchange timeout after 15 seconds')), 15000)
                )

                addDebugInfo('EXCHANGE_STARTING', {
                    timestamp: new Date().toISOString(),
                    method: 'exchangeCodeForSession'
                })

                const exchangeStartTime = Date.now()
                let exchangeResult

                try {
                    exchangeResult = await Promise.race([
                        exchangePromise,
                        timeoutPromise
                    ]) as any

                    const exchangeDuration = Date.now() - exchangeStartTime
                    addDebugInfo('EXCHANGE_COMPLETED', {
                        duration: exchangeDuration,
                        hasData: !!exchangeResult?.data,
                        hasSession: !!exchangeResult?.data?.session,
                        hasUser: !!exchangeResult?.data?.user,
                        hasError: !!exchangeResult?.error
                    })

                } catch (exchangeError: any) {
                    const exchangeDuration = Date.now() - exchangeStartTime
                    addDebugInfo('EXCHANGE_ERROR', {
                        duration: exchangeDuration,
                        error: exchangeError?.message || exchangeError,
                        errorCode: exchangeError?.code,
                        errorDetails: exchangeError
                    })

                    console.error('❌ Code exchange error:', exchangeError)
                    setError(`Authentication failed: ${exchangeError.message}`)
                    setTimeout(() => {
                        router.push('/auth/login?error=exchange_failed')
                    }, 2000)
                    return
                }

                const { data, error: exchangeError } = exchangeResult

                if (exchangeError) {
                    addDebugInfo('EXCHANGE_RESULT_ERROR', {
                        error: exchangeError.message,
                        errorCode: exchangeError.code,
                        errorDetails: exchangeError
                    })

                    console.error('❌ Code exchange error:', exchangeError)
                    setError(`Authentication failed: ${exchangeError.message}`)
                    setTimeout(() => {
                        router.push('/auth/login?error=exchange_failed')
                    }, 2000)
                    return
                }

                if (data?.session && data?.user) {
                    addDebugInfo('EXCHANGE_SUCCESS', {
                        userId: data.user.id,
                        email: data.user.email,
                        provider: data.user.app_metadata?.provider,
                        sessionValid: !!data.session.access_token,
                        tokenPreview: data.session.access_token ?
                            `${data.session.access_token.substring(0, 10)}...` : 'none'
                    })

                    console.log('✅ Authentication successful:', {
                        userId: data.user.id,
                        email: data.user.email,
                        provider: data.user.app_metadata?.provider
                    })

                    setStatus('Authentication successful! Redirecting...')

                    // Get the return URL from session storage or default to home
                    const returnUrl = sessionStorage.getItem('returnUrl') || '/'
                    sessionStorage.removeItem('returnUrl') // Clean up

                    addDebugInfo('REDIRECT_PREPARATION', {
                        returnUrl,
                        sessionStorageCleared: true
                    })

                    console.log('🏠 Redirecting to:', returnUrl)

                    // Give a moment for the state to update, then redirect
                    setTimeout(() => {
                        addDebugInfo('REDIRECT_EXECUTING', { to: returnUrl })
                        router.push(returnUrl)
                    }, 1000)
                } else {
                    addDebugInfo('NO_SESSION_ERROR', {
                        hasData: !!data,
                        hasSession: !!data?.session,
                        hasUser: !!data?.user,
                        dataKeys: data ? Object.keys(data) : []
                    })

                    console.error('❌ No session created after code exchange')
                    setError('Authentication failed - no session created')
                    setTimeout(() => {
                        router.push('/auth/login?error=no_session')
                    }, 2000)
                }
            } catch (error: any) {
                addDebugInfo('UNEXPECTED_ERROR', {
                    error: error?.message || error,
                    stack: error?.stack,
                    type: typeof error
                })

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
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center max-w-2xl">
                    <div className="text-red-500 text-xl mb-4">❌</div>
                    <h1 className="text-xl font-semibold mb-2">Authentication Error</h1>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground mb-6">Redirecting to login page...</p>

                    {/* Debug Info Display */}
                    <details className="text-left bg-muted p-4 rounded text-xs">
                        <summary className="cursor-pointer font-medium mb-2">Debug Information</summary>
                        <pre className="whitespace-pre-wrap overflow-auto max-h-96">
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{status}</p>
                <p className="mt-2 text-sm text-muted-foreground">Please wait while we complete your authentication...</p>

                {/* Debug Info Display */}
                <details className="mt-6 text-left bg-muted p-4 rounded text-xs">
                    <summary className="cursor-pointer font-medium mb-2">Live Debug Information</summary>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-96">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </details>
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