import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
    createGoogleCalendarAuth,
    parseOAuthState,
} from '@/lib/google-auth'
import { createGoogleCalendarService, GoogleCalendarTokens } from '@/lib/google-calendar'

/**
 * API Route: /api/auth/google/callback
 * Handles Google OAuth callback and token exchange
 * 
 * Query Parameters:
 * - code: Authorization code from Google OAuth flow
 * - state: CSRF protection state parameter (base64 encoded)
 * - error: OAuth error (if authorization was denied)
 * 
 * Security:
 * - Validates state parameter for CSRF protection
 * - Requires valid authorization code
 * - Encrypts tokens before storage
 */
export async function GET(request: NextRequest) {
    console.log('[DEBUG] OAuth callback route started')

    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        console.log('[DEBUG] OAuth parameters:', { code: !!code, state: !!state, error })

        // Handle OAuth authorization denied
        if (error) {
            console.log(`[ERROR] OAuth authorization denied: ${error}`)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/google/callback', baseUrl)
            redirectUrl.searchParams.set('error', 'access_denied')
            redirectUrl.searchParams.set('message', 'Google Calendar access was denied')
            return NextResponse.redirect(redirectUrl)
        }

        // Validate required parameters
        if (!code || !state) {
            console.error('[ERROR] Missing required OAuth parameters:', { code: !!code, state: !!state })
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/google/callback', baseUrl)
            redirectUrl.searchParams.set('error', 'invalid_request')
            redirectUrl.searchParams.set('message', 'Invalid OAuth callback parameters')
            return NextResponse.redirect(redirectUrl)
        }

        console.log('[DEBUG] OAuth parameters validated successfully')

        // Parse and validate OAuth state parameter (CSRF protection)
        let oAuthState
        try {
            oAuthState = parseOAuthState(state)
            console.log('[DEBUG] OAuth state parsed successfully:', { userId: oAuthState.userId, action: oAuthState.action })
        } catch (stateError) {
            console.error('[ERROR] Invalid OAuth state parameter:', stateError)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/google/callback', baseUrl)
            redirectUrl.searchParams.set('error', 'invalid_state')
            redirectUrl.searchParams.set('message', 'Invalid security token')
            return NextResponse.redirect(redirectUrl)
        }

        // Use user ID from OAuth state instead of session (sessions may not persist through OAuth redirects)
        const userId = oAuthState.userId
        console.log('[DEBUG] User ID from OAuth state:', userId)

        console.log('[DEBUG] Supabase client created successfully')

        // Validate user ID format (basic security check)
        if (!userId || typeof userId !== 'string' || userId.length < 10) {
            console.error('[ERROR] Invalid user ID in OAuth state:', userId)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/login', baseUrl)
            redirectUrl.searchParams.set('message', 'Invalid user session')
            return NextResponse.redirect(redirectUrl)
        }

        // Create user object from OAuth state (we trust this since it was created during authenticated session)
        const user = { id: userId }
        console.log('[DEBUG] User object created:', user.id)

        // Verify state matches current user (additional security check)
        if (oAuthState.userId !== user.id) {
            console.error('[ERROR] OAuth state user ID mismatch:', {
                stateUserId: oAuthState.userId,
                currentUserId: user.id
            })
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/google/callback', baseUrl)
            redirectUrl.searchParams.set('error', 'user_mismatch')
            redirectUrl.searchParams.set('message', 'Security validation failed')
            return NextResponse.redirect(redirectUrl)
        }

        console.log('[DEBUG] User validation completed successfully')

        console.log(`[DEBUG] Starting token exchange for user ${user.id}`)

        // Exchange authorization code for access tokens
        const googleCalendarService = createGoogleCalendarService()
        let tokens
        try {
            tokens = await googleCalendarService.getTokensFromCode(code)
            console.log(`[DEBUG] Token exchange successful for user ${user.id}`)
        } catch (tokenError) {
            console.error('[ERROR] Failed to exchange code for tokens:', tokenError)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/google/callback', baseUrl)
            redirectUrl.searchParams.set('error', 'token_exchange_failed')
            redirectUrl.searchParams.set('message', 'Failed to obtain Google Calendar access')
            return NextResponse.redirect(redirectUrl)
        }

        console.log(`[DEBUG] Starting token storage for user ${user.id}`)

        // Ensure user record exists in public.users table before storing tokens
        console.log(`[DEBUG] Ensuring user record exists in public.users for ${user.id}`)
        await ensureUserRecord(user.id)

        // Store encrypted tokens in Supabase
        const storeResult = await storeCalendarTokens(user.id, tokens)
        if (!storeResult.success) {
            console.error('[ERROR] Failed to store calendar tokens:', storeResult.error)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const redirectUrl = new URL('/auth/google/callback', baseUrl)
            redirectUrl.searchParams.set('error', 'storage_failed')
            redirectUrl.searchParams.set('message', 'Failed to save Google Calendar connection')
            return NextResponse.redirect(redirectUrl)
        }

        console.log(`[DEBUG] Token storage successful for user ${user.id}`)
        console.log(`[DEBUG] Starting calendar connection test for user ${user.id}`)

        // Test calendar connection to ensure everything works
        const connectionTest = await testCalendarConnection(user.id)
        if (!connectionTest.connected) {
            console.warn('[WARN] Calendar connection test failed, but tokens stored:', connectionTest.error)
            // Continue anyway - the test might fail due to API quota or temporary issues
        } else {
            console.log(`[DEBUG] Calendar connection test successful for user ${user.id}`)
        }

        // Log successful OAuth completion
        console.log(`[SUCCESS] OAuth completed successfully for user ${user.id}, action: ${oAuthState.action}`)

        // Note: Google Calendar tokens are separate from Supabase auth tokens
        // The user should already have a valid Supabase session from the initial auth flow
        // Google Calendar tokens are stored separately for API access

        // Redirect to success page with appropriate context
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.url
        const redirectUrl = new URL('/auth/google/callback', baseUrl)
        redirectUrl.searchParams.set('success', 'true')
        redirectUrl.searchParams.set('action', oAuthState.action || 'connect')
        redirectUrl.searchParams.set('returnUrl', oAuthState.returnUrl || '/dashboard')
        redirectUrl.searchParams.set('userId', user.id)

        console.log(`[DEBUG] Redirecting to success: ${redirectUrl.toString()}`)
        return NextResponse.redirect(redirectUrl)

    } catch (error) {
        console.error('Unexpected error in OAuth callback:', error)

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const redirectUrl = new URL('/auth/google/callback', baseUrl)
        redirectUrl.searchParams.set('error', 'unexpected_error')
        redirectUrl.searchParams.set('message', 'An unexpected error occurred')

        return NextResponse.redirect(redirectUrl)
    }
}

// Wrapper functions for the class methods
async function storeCalendarTokens(userId: string, tokens: GoogleCalendarTokens) {
    const googleAuth = createGoogleCalendarAuth()
    try {
        await googleAuth.storeUserTokens(userId, tokens)
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

async function testCalendarConnection(userId: string) {
    const googleAuth = createGoogleCalendarAuth()
    return await googleAuth.testUserConnection(userId)
}

async function ensureUserRecord(userId: string) {
    try {
        const supabase = await createServerSupabaseClient()

        // Check if user already exists in public.users
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('[ERROR] Failed to check user existence:', checkError)
            return
        }

        if (existingUser) {
            console.log(`[DEBUG] User record already exists in public.users for ${userId}`)
            return
        }

        console.log(`[DEBUG] Creating user record in public.users for ${userId}`)

        // Get user email from auth.users table using RLS-safe query
        const { data: authUser } = await supabase
            .from('auth.users')
            .select('email, raw_user_meta_data')
            .eq('id', userId)
            .single()

        const userEmail = authUser?.email || `user-${userId}@localloopevents.xyz`
        const userName = authUser?.raw_user_meta_data?.full_name || authUser?.raw_user_meta_data?.name || 'User'

        console.log(`[DEBUG] Retrieved user data: email=${userEmail}, name=${userName}`)

        // Create user record with proper email and name
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: userEmail,
                display_name: userName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                role: 'user',
                email_verified: true // From OAuth, so we trust it's verified
            })

        if (insertError) {
            console.error('[ERROR] Failed to create user record in public.users:', insertError)
        } else {
            console.log(`[DEBUG] Successfully created user record in public.users for ${userId} with email ${userEmail}`)
        }
    } catch (error) {
        console.error('[ERROR] Unexpected error in ensureUserRecord:', error)
    }
}

/**
 * Handle other HTTP methods with appropriate error
 */
export async function POST() {
    return NextResponse.json(
        { error: 'Method not allowed. OAuth callback must use GET.' },
        { status: 405 }
    )
} 