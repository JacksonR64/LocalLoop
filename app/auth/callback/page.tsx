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
    const [debugInfo, setDebugInfo] = useState<any[]>([])

    // Helper function to add debug info
    const addDebugInfo = (step: string, data: any) => {
        const timestamp = new Date().toISOString()
        const debugEntry = { timestamp, step, data }
        console.log(`🔍 [Auth Debug] ${step}:`, data)
        setDebugInfo(prev => [...prev, debugEntry])
        return debugEntry
    }

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                addDebugInfo('CALLBACK_START', {
                    url: window.location.href,
                    searchParams: Object.fromEntries(searchParams.entries())
                })

                // Extract parameters from URL
                const code = searchParams.get('code')
                const errorParam = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')
                const state = searchParams.get('state')

                addDebugInfo('URL_PARAMS_EXTRACTED', {
                    hasCode: !!code,
                    codeLength: code?.length || 0,
                    hasError: !!errorParam,
                    error: errorParam,
                    errorDescription: errorDescription,
                    hasState: !!state
                })

                // Handle error in URL params
                if (errorParam) {
                    const errorMessage = errorDescription || errorParam
                    setError(`OAuth Error: ${errorMessage}`)
                    setStatus('Authentication failed')
                    addDebugInfo('URL_ERROR_DETECTED', { error: errorParam, description: errorDescription })

                    setTimeout(() => {
                        router.replace('/auth/login?error=oauth_error')
                    }, 3000)
                    return
                }

                // Validate authorization code
                if (!code) {
                    setError('No authorization code received from OAuth provider')
                    setStatus('Authentication failed')
                    addDebugInfo('MISSING_AUTH_CODE', { received: 'no code parameter' })

                    setTimeout(() => {
                        router.replace('/auth/login?error=missing_code')
                    }, 3000)
                    return
                }

                addDebugInfo('CODE_VALIDATION_PASSED', {
                    codePreview: code.substring(0, 8) + '...' + code.substring(code.length - 8),
                    codeLength: code.length
                })

                // Check PKCE storage state
                const pkceStorage = {
                    hasStoredCodeVerifier: !!(
                        sessionStorage.getItem('supabase.auth.code_verifier') ||
                        localStorage.getItem('supabase.auth.code_verifier') ||
                        // Check for other possible PKCE storage keys
                        sessionStorage.getItem('sb-auth-code-verifier') ||
                        localStorage.getItem('sb-auth-code-verifier')
                    ),
                    hasStoredState: !!(
                        sessionStorage.getItem('supabase.auth.state') ||
                        localStorage.getItem('supabase.auth.state') ||
                        sessionStorage.getItem('sb-auth-state') ||
                        localStorage.getItem('sb-auth-state')
                    ),
                    sessionStorageKeys: Object.keys(sessionStorage),
                    localStorageKeys: Object.keys(localStorage).filter(k =>
                        k.includes('supabase') || k.includes('sb-') || k.includes('auth')
                    )
                }

                addDebugInfo('PKCE_STORAGE_CHECK', pkceStorage)

                // Set more descriptive status
                setStatus('Exchanging authorization code for session...')

                addDebugInfo('EXCHANGE_STARTING', {
                    timestamp: new Date().toISOString(),
                    method: 'exchangeCodeForSession'
                })

                // Exchange code for session with proper error handling
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                addDebugInfo('EXCHANGE_COMPLETED', {
                    hasData: !!data,
                    hasSession: !!data?.session,
                    hasUser: !!data?.user,
                    hasError: !!exchangeError,
                    error: exchangeError?.message || null,
                    errorCode: exchangeError?.status || null
                })

                if (exchangeError) {
                    console.error('❌ Token exchange failed:', exchangeError)

                    // More specific error handling
                    if (exchangeError.message?.includes('code verifier')) {
                        setError('Authentication failed: PKCE verification error. This might be due to browser security settings.')
                        setStatus('PKCE Verification Failed')
                        addDebugInfo('PKCE_ERROR', {
                            message: exchangeError.message,
                            suggestion: 'Try disabling adblockers or using a different browser'
                        })
                    } else if (exchangeError.message?.includes('invalid') || exchangeError.message?.includes('expired')) {
                        setError('Authentication failed: Invalid or expired authorization code.')
                        setStatus('Code Exchange Failed')
                    } else {
                        setError(`Authentication failed: ${exchangeError.message}`)
                        setStatus('Exchange Error')
                    }

                    addDebugInfo('REDIRECT_TO_LOGIN', { reason: 'exchange_failed' })

                    setTimeout(() => {
                        router.replace('/auth/login?error=exchange_failed')
                    }, 5000)
                    return
                }

                if (data?.user) {
                    console.log('✅ Authentication successful:', data.user.email)
                    setStatus('Authentication successful! Redirecting...')

                    addDebugInfo('AUTH_SUCCESS', {
                        userId: data.user.id,
                        email: data.user.email,
                        hasSession: !!data.session
                    })

                    // Get return URL from storage
                    const returnUrl = sessionStorage.getItem('returnUrl')
                    if (returnUrl && !returnUrl.startsWith('/auth/')) {
                        sessionStorage.removeItem('returnUrl')
                        addDebugInfo('REDIRECT_TO_RETURN_URL', { returnUrl })
                        router.replace(returnUrl)
                    } else {
                        addDebugInfo('REDIRECT_TO_HOME', { reason: 'no_return_url' })
                        router.replace('/')
                    }
                } else {
                    setError('Authentication completed but no user data received')
                    setStatus('Authentication incomplete')
                    addDebugInfo('NO_USER_DATA', { hasData: !!data })

                    setTimeout(() => {
                        router.replace('/auth/login?error=no_user_data')
                    }, 3000)
                }

            } catch (error: any) {
                console.error('💥 Callback error:', error)
                setError(`Exchange timeout after 15 seconds`)
                setStatus('Authentication timeout')

                addDebugInfo('CALLBACK_EXCEPTION', {
                    error: error.message,
                    stack: error.stack,
                    type: error.constructor.name
                })

                setTimeout(() => {
                    router.replace('/auth/login?error=callback_timeout')
                }, 3000)
            }
        }

        handleAuthCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-blue-600">
                        {error ? (
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-12 h-12 text-red-600">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </div>

                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        {error ? 'Authentication Error' : 'Completing Sign In'}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {error || status}
                    </p>

                    {error && (
                        <div className="mt-4">
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                            >
                                Return to login page →
                            </button>
                        </div>
                    )}

                    {/* Debug information for development */}
                    {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
                        <details className="mt-8 text-left">
                            <summary className="cursor-pointer text-blue-600 font-medium">
                                🔍 Debug Information
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        </div>
    )
}

function AuthCallbackLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 text-blue-600 mx-auto">
                    <svg fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Loading authentication handler...
                </p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<AuthCallbackLoading />}>
            <AuthCallbackContent />
        </Suspense>
    )
} 