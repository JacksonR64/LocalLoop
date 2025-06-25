'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        user,
        loading: authLoading,
        signIn,
        signInWithGoogle,
        signInWithApple,
        clearStaleAuthData,
        isGoogleAuthEnabled,
        isAppleAuthEnabled
    } = useAuth()
    const router = useRouter()

    // Handle OAuth callback errors from URL parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const oauthError = urlParams.get('error')

        if (oauthError) {
            const errorMessages: Record<string, string> = {
                'timeout': 'OAuth authentication timed out. Please try again.',
                'no_code': 'No authorization code received from Google. Please try again.',
                'invalid_code': 'Invalid authorization code. Please try again.',
                'no_session': 'Failed to create session. Please try again.',
                'auth_failed': 'Authentication failed. Please try again.',
                'callback_failed': 'OAuth callback failed. Please try again.',
                'exchange_failed': 'Failed to exchange authorization code. Please try again.',
                'access_denied': 'Access was denied. Please try again if you want to sign in.',
                'server_error': 'Server error during authentication. Please try again.'
            }

            const errorMessage = errorMessages[oauthError] || `Authentication error: ${oauthError}. Please try again.`
            setError(errorMessage)

            // Clear the error from URL without page reload
            const newUrl = window.location.pathname
            window.history.replaceState({}, '', newUrl)
        }
    }, [])

    // Auto-redirect when user becomes authenticated
    useEffect(() => {
        if (user && !authLoading) {
            router.push('/')
        }
    }, [user, authLoading, router])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await signIn(email, password)
            // Reset loading state after successful sign in
            setLoading(false)
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        if (!isGoogleAuthEnabled) {
            setError('Google authentication is currently disabled')
            return
        }

        try {
            await signInWithGoogle()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        }
    }

    const handleAppleLogin = async () => {
        if (!isAppleAuthEnabled) {
            setError('Apple authentication is coming soon! We need an Apple Developer account to enable this feature.')
            return
        }

        try {
            await signInWithApple()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        }
    }

    const handleClearAuthData = async () => {
        try {
            await clearStaleAuthData()
            setError('')
            // Optionally refresh the page to ensure clean state
            window.location.reload()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to clear auth data')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-6 sm:p-8 border border-border rounded-lg shadow-sm bg-card">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                        Sign in to LocalLoop
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Or{' '}
                        <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
                            create a new account
                        </Link>
                    </p>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleEmailLogin}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-4 py-3 border border-border placeholder-muted-foreground text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
                                placeholder="Email address"
                                data-testid="email-input"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-4 py-3 border border-border placeholder-muted-foreground text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
                                placeholder="Password"
                                data-testid="password-input"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href="/auth/reset-password" className="text-sm text-primary hover:text-primary/80">
                            Forgot your password?
                        </Link>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 min-h-[44px]"
                            data-testid="login-submit-button"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Google Auth Button */}
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                disabled={!isGoogleAuthEnabled}
                                className={`w-full inline-flex justify-center items-center py-3 px-4 border rounded-md shadow-sm text-base font-medium transition-colors min-h-[44px] ${isGoogleAuthEnabled
                                    ? 'border-border bg-background text-muted-foreground hover:bg-accent'
                                    : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Google</span>
                            </button>

                            {/* Apple Auth Button */}
                            <button
                                onClick={handleAppleLogin}
                                type="button"
                                disabled={!isAppleAuthEnabled}
                                className={`w-full inline-flex justify-center items-center py-3 px-4 border rounded-md shadow-sm text-base font-medium transition-colors min-h-[44px] ${isAppleAuthEnabled
                                    ? 'border-border bg-background text-muted-foreground hover:bg-accent'
                                    : 'border-border bg-muted text-muted-foreground cursor-not-allowed relative'
                                    }`}
                                title={!isAppleAuthEnabled ? 'Apple Sign-in coming soon! We\'re working on getting an Apple Developer account.' : ''}
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                <span>Apple</span>
                                {!isAppleAuthEnabled && (
                                    <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
                                )}
                            </button>
                        </div>

                    </div>
                </form>

                {/* Debug: Clear stale auth data button */}
                <div className="mt-6 pt-4 border-t border-border">
                    <button
                        onClick={handleClearAuthData}
                        type="button"
                        className="w-full text-xs text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors"
                    >
                        Having login issues? Clear authentication data
                    </button>
                </div>
            </div>
        </div>
    )
} 