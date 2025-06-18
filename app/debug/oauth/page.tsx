'use client'

import { useEffect, useState } from 'react'

export default function OAuthDebugPage() {
    const [debugInfo, setDebugInfo] = useState<any[]>([])
    const [preOAuthDebug, setPreOAuthDebug] = useState<any>(null)
    const [postOAuthDebug, setPostOAuthDebug] = useState<any>(null)

    useEffect(() => {
        // Retrieve saved OAuth debug info from sessionStorage
        try {
            const savedDebugInfo = sessionStorage.getItem('oauth_debug_info')
            if (savedDebugInfo) {
                setDebugInfo(JSON.parse(savedDebugInfo))
            }

            const preOAuth = sessionStorage.getItem('pre_oauth_debug')
            if (preOAuth) {
                setPreOAuthDebug(JSON.parse(preOAuth))
            }

            const postOAuth = sessionStorage.getItem('post_oauth_debug')
            if (postOAuth) {
                setPostOAuthDebug(JSON.parse(postOAuth))
            }
        } catch (e) {
            console.error('Could not load debug info', e)
        }
    }, [])

    const clearDebugInfo = () => {
        sessionStorage.removeItem('oauth_debug_info')
        sessionStorage.removeItem('pre_oauth_debug')
        sessionStorage.removeItem('post_oauth_debug')
        setDebugInfo([])
        setPreOAuthDebug(null)
        setPostOAuthDebug(null)
    }

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground">OAuth Debug Information</h1>
                    <button
                        onClick={clearDebugInfo}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Clear Debug Info
                    </button>
                </div>

                {debugInfo.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No OAuth debug information available.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Debug info will appear here after an OAuth flow attempt.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* OAuth Initiation Debug */}
                        {(preOAuthDebug || postOAuthDebug) && (
                            <div className="bg-card border rounded-lg p-4">
                                <h2 className="text-xl font-semibold mb-4">OAuth Initiation Analysis</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {preOAuthDebug && (
                                        <div>
                                            <h3 className="font-semibold text-sm mb-2">Before OAuth Call</h3>
                                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                                                {JSON.stringify(preOAuthDebug, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    
                                    {postOAuthDebug && (
                                        <div>
                                            <h3 className="font-semibold text-sm mb-2">After OAuth Call</h3>
                                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                                                {JSON.stringify(postOAuthDebug, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                                
                                {preOAuthDebug && postOAuthDebug && (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                                        <h4 className="font-semibold text-sm">Key Differences:</h4>
                                        <ul className="text-xs mt-2 space-y-1">
                                            <li>Session keys added: {postOAuthDebug.sessionStorageKeys.length - preOAuthDebug.sessionStorageKeys.length}</li>
                                            <li>Local keys added: {postOAuthDebug.localStorageKeys.length - preOAuthDebug.localStorageKeys.length}</li>
                                            <li>PKCE code verifier stored: {postOAuthDebug.hasCodeVerifier ? '✅ Yes' : '❌ No'}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-card border rounded-lg p-4">
                            <h2 className="text-xl font-semibold mb-4">OAuth Flow Steps ({debugInfo.length} steps)</h2>
                            
                            <div className="space-y-3">
                                {debugInfo.map((entry, index) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-foreground">{entry.step}</h3>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(entry.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                                            {JSON.stringify(entry.data, null, 2)}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card border rounded-lg p-4">
                            <h2 className="text-xl font-semibold mb-4">Raw Debug Data (JSON)</h2>
                            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}