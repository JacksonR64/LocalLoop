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
                                className={`w-full inline-flex justify-center py-3 px-4 border rounded-md shadow-sm text-base font-medium transition-colors min-h-[44px] ${isGoogleAuthEnabled
                                    ? 'border-border bg-background text-muted-foreground hover:bg-accent'
                                    : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                                    }`}
                            >
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
                                title={!isAppleAuthEnabled ? 'Coming soon! Requires Apple Developer account' : ''}
                            >
                                {!isAppleAuthEnabled && (
                                    <Lock className="w-3 h-3 mr-1 text-muted-foreground" />
                                )}
                                <span>Apple</span>
                                {!isAppleAuthEnabled && (
                                    <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
                                )}
                            </button>
                        </div>

                        {!isAppleAuthEnabled && (
                            <p className="mt-2 text-xs text-center text-muted-foreground">
                                Apple Sign-in coming soon! We&apos;re working on getting an Apple Developer account.
                            </p>
                        )}
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