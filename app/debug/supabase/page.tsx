'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseDebugPage() {
    const [testResults, setTestResults] = useState<any[]>([])

    useEffect(() => {
        const runDiagnostics = async () => {
            const results: any[] = []
            
            // Test 1: Basic client info
            results.push({
                test: 'Client Configuration',
                result: {
                    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
                    storageKey: 'sb-*-auth-token',
                    clientType: typeof supabase
                }
            })

            // Test 2: Basic auth methods
            try {
                const session = await supabase.auth.getSession()
                results.push({
                    test: 'getSession() call',
                    result: {
                        success: true,
                        hasSession: !!session.data.session,
                        hasUser: !!session.data.session?.user,
                        error: session.error?.message
                    }
                })
            } catch (error: any) {
                results.push({
                    test: 'getSession() call',
                    result: {
                        success: false,
                        error: error.message
                    }
                })
            }

            // Test 3: OAuth URL generation (without redirect)
            try {
                const oauth = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'select_account',
                        },
                        skipBrowserRedirect: true // This prevents actual redirect
                    }
                })
                
                results.push({
                    test: 'OAuth URL Generation',
                    result: {
                        success: !oauth.error,
                        hasUrl: !!oauth.data?.url,
                        urlPreview: oauth.data?.url?.substring(0, 100) + '...',
                        error: oauth.error?.message,
                        provider: oauth.data?.provider
                    }
                })
            } catch (error: any) {
                results.push({
                    test: 'OAuth URL Generation',
                    result: {
                        success: false,
                        error: error.message
                    }
                })
            }

            // Test 4: Storage state
            results.push({
                test: 'Browser Storage State',
                result: {
                    localStorageKeys: Object.keys(localStorage),
                    sessionStorageKeys: Object.keys(sessionStorage),
                    supabaseKeys: Object.keys(localStorage).filter(k => k.includes('supabase')),
                    sbKeys: Object.keys(localStorage).filter(k => k.startsWith('sb-')),
                    hasAuthToken: Object.keys(localStorage).some(k => k.includes('auth-token'))
                }
            })

            setTestResults(results)
        }

        runDiagnostics()
    }, [])

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-foreground mb-6">Supabase Client Diagnostics</h1>

                <div className="space-y-4">
                    {testResults.map((test, index) => (
                        <div key={index} className="bg-card border rounded-lg p-4">
                            <h2 className="text-lg font-semibold mb-2">{test.test}</h2>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                                {JSON.stringify(test.result, null, 2)}
                            </pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}