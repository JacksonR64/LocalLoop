import { createClient } from '@/utils/supabase/client'

// Default client for client-side usage - using new structure
export const supabase = createClient()

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
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)

    // Additional client validation
    if (typeof window !== 'undefined') {
        console.log('🚀 Supabase client created successfully')

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
