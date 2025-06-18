import { createBrowserClient } from '@supabase/ssr'

// Fallback values for build time when environment variables might not be available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key'

// Debug logging for production issues
if (typeof window !== 'undefined') {
    console.log('🔍 Supabase client configuration:', {
        url: supabaseUrl,
        hasValidUrl: supabaseUrl !== 'http://localhost:54321',
        hasValidKey: supabaseAnonKey !== 'fallback-key',
        keyLength: supabaseAnonKey.length,
        urlPrefix: supabaseUrl.substring(0, 30) + '...',
        isProduction: process.env.NODE_ENV === 'production'
    })

    // Test if we can reach the Supabase URL
    if (supabaseUrl !== 'http://localhost:54321') {
        fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        })
            .then(response => {
                console.log('✅ Supabase connection test:', {
                    status: response.status,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries())
                })
            })
            .catch(error => {
                console.error('❌ Supabase connection test failed:', error)
            })
    } else {
        console.warn('⚠️ Using fallback Supabase URL - environment variables not loaded!')
    }
}

export function createClient() {
    const client = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    if (typeof document !== 'undefined') {
                        const value = `; ${document.cookie}`;
                        const parts = value.split(`; ${name}=`);
                        if (parts.length === 2) return parts.pop()?.split(';').shift();
                    }
                    return undefined;
                },
                set(name: string, value: string, options: any) {
                    if (typeof document !== 'undefined') {
                        let cookieString = `${name}=${value}`;
                        if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
                        if (options?.path) cookieString += `; path=${options.path}`;
                        if (options?.domain) cookieString += `; domain=${options.domain}`;
                        if (options?.secure) cookieString += `; secure`;
                        if (options?.httpOnly) cookieString += `; httponly`;
                        if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
                        document.cookie = cookieString;
                    }
                },
                remove(name: string, options: any) {
                    if (typeof document !== 'undefined') {
                        let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
                        if (options?.path) cookieString += `; path=${options.path}`;
                        if (options?.domain) cookieString += `; domain=${options.domain}`;
                        document.cookie = cookieString;
                    }
                }
            },
            auth: {
                // Enable PKCE flow for OAuth
                flowType: 'pkce',
                // Auto refresh tokens
                autoRefreshToken: true,
                // Persist session in storage
                persistSession: true,
                // Detect session in URL
                detectSessionInUrl: true,
                // Enable debug mode in development
                debug: process.env.NODE_ENV === 'development'
            }
        }
    )

    // Additional client validation
    if (typeof window !== 'undefined') {
        console.log('🚀 Supabase client created successfully with PKCE configuration')

        // Test basic auth functionality
        client.auth.getSession()
            .then(({ data, error }) => {
                if (error) {
                    console.error('❌ Initial session check failed:', error)
                } else {
                    console.log('✅ Initial session check successful:', {
                        hasSession: !!data.session,
                        user: data.session?.user?.email || 'no user'
                    })
                }
            })
            .catch(error => {
                console.error('❌ Session check threw error:', error)
            })
    }

    return client
}

// Default client for client-side usage
export const supabase = createClient() 