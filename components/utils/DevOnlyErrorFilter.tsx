'use client'

import { useEffect } from 'react'

/**
 * Filters out development-only console messages that cannot be fixed
 * Only active in development mode and only suppresses specific known dev-only warnings
 */
export function DevOnlyErrorFilter() {
    useEffect(() => {
        // Only active in development
        if (process.env.NODE_ENV !== 'development') return

        // Store original console methods
        const originalLog = console.log
        const originalWarn = console.warn
        const originalError = console.error

        // Override console.log to filter Stripe development warnings
        console.log = (...args) => {
            const message = args[0]?.toString() || ''
            
            // Suppress Stripe HTTPS development warning (unfixable in dev)
            if (message.includes('You may test your Stripe.js integration over HTTP') ||
                message.includes('However, live Stripe.js integrations must use HTTPS')) {
                return // Silently ignore - this is expected in development
            }

            // Call original for all other logs
            originalLog.apply(console, args)
        }

        // Override console.warn for development warnings
        console.warn = (...args) => {
            const message = args[0]?.toString() || ''
            
            // Suppress Stripe HTTPS development warning (unfixable in dev)
            if (message.includes('You may test your Stripe.js integration over HTTP') ||
                message.includes('However, live Stripe.js integrations must use HTTPS')) {
                return // Silently ignore - this is expected in development
            }

            // Call original for all other warnings
            originalWarn.apply(console, args)
        }

        // Override console.error to filter expected 401s from Google Calendar
        console.error = (...args) => {
            const message = args[0]?.toString() || ''
            
            // Suppress expected 401 errors from Google Calendar API for unauthenticated users
            if (message.includes('GET http://localhost:3000/api/auth/google/status 401') ||
                message.includes('api/auth/google/status 401')) {
                return // Silently ignore - this is expected for guest users
            }

            // Call original for all other errors
            originalError.apply(console, args)
        }

        // Cleanup function
        return () => {
            console.log = originalLog
            console.warn = originalWarn
            console.error = originalError
        }
    }, [])

    return null // This component renders nothing
}