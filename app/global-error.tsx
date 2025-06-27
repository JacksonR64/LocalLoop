'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Filter out known non-critical errors that don't affect functionality
    const ignorableErrors = [
      'Minified React error #418', // Focus management 
      'Minified React error #419', // Hydration
      'roving-focus-group',        // Radix roving focus
      'focus-scope',               // Radix focus scope
      'vercel.live',               // Vercel preview features
      'feedback.js',               // Vercel feedback widget
    ]
    
    const shouldIgnore = ignorableErrors.some(pattern => 
      error.message?.includes(pattern) || error.stack?.includes(pattern)
    )
    
    // Only log in development or for critical errors
    if (!shouldIgnore || process.env.NODE_ENV === 'development') {
      console.error('Global error:', error)
    }
  }, [error])

  // In production, try to recover silently from non-critical errors
  const ignorableErrors = [
    'Minified React error #418',
    'Minified React error #419', 
    'roving-focus-group',
    'focus-scope',
    'vercel.live',
    'feedback.js',
  ]
  
  const shouldIgnore = ignorableErrors.some(pattern => 
    error.message?.includes(pattern) || error.stack?.includes(pattern)
  )
  
  if (shouldIgnore && process.env.NODE_ENV === 'production') {
    // Silently reset non-critical errors in production
    reset()
    return null
  }

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Something went wrong!
            </h2>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-sm text-gray-600 mb-4">
                {error.message}
              </p>
            )}
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}