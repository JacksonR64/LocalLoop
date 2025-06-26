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

        // Cleanup function
        return () => {
            console.log = originalLog
            console.warn = originalWarn
        }
    }, [])

    return null // This component renders nothing
}