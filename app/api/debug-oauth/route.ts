import { NextResponse } from 'next/server'
import { createGoogleCalendarService } from '@/lib/google-calendar'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        console.log('🔍 [Debug] OAuth debug endpoint called')

        // Test Google Calendar service (this is working fine)
        const googleCalendarService = createGoogleCalendarService()
        const authUrl = googleCalendarService.getAuthUrl('debug-test')

        // Test Supabase Auth configuration
        let supabaseAuthTest = null
        let supabaseAuthError = null

        try {
            // Test if we can initialize OAuth flow with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
                    skipBrowserRedirect: true
                }
            })

            supabaseAuthTest = {
                hasData: !!authData,
                hasUrl: !!authData?.url,
                provider: authData?.provider,
                hasError: !!authError
            }

            if (authError) {
                supabaseAuthError = authError as any // Type assertion to handle the error properly
            }
        } catch (err: any) {
            supabaseAuthError = err
        }

        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            googleCalendar: {
                authUrl,
                configured: true
            },
            supabaseAuth: {
                test: supabaseAuthTest,
                error: supabaseAuthError?.message || null,
                config: {
                    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
                }
            },
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
                NEXT_PUBLIC_ENABLE_GOOGLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH || 'default(true)'
            },
            pkceInfo: {
                note: 'PKCE is handled automatically by Supabase Auth',
                checkClientSide: 'Check browser storage for supabase.auth.code_verifier'
            }
        }

        console.log('🔍 [Debug] OAuth debug response:', response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('💥 [Debug] OAuth debug error:', error)
        return NextResponse.json({
            success: false,
            error: String(error),
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
            }
        })
    }
} 