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

        // Store original console.info for passive event listener violations
        const originalInfo = console.info

        // Override console.warn for development warnings
        console.warn = (...args) => {
            const message = args[0]?.toString() || ''
            
            // Suppress Stripe HTTPS development warning (unfixable in dev)
            if (message.includes('You may test your Stripe.js integration over HTTP') ||
                message.includes('However, live Stripe.js integrations must use HTTPS')) {
                return // Silently ignore - this is expected in development
            }

            // Suppress third-party passive event listener violations (unfixable - external libraries)
            if (message.includes('[Violation] Added non-passive event listener') ||
                message.includes('Consider marking event handler as \'passive\'') ||
                message.includes('hcaptcha.html') ||
                message.includes('shared-e864a3e608739f9df23f774b6d751e03.js') ||
                message.includes('setTimeout\' handler took')) {
                return // Silently ignore - these are from hCaptcha/Stripe (external libraries)
            }

            // Call original for all other warnings
            originalWarn.apply(console, args)
        }

        // Override console.info to catch violation messages that might come through info
        console.info = (...args) => {
            const message = args[0]?.toString() || ''
            
            // Suppress third-party passive event listener violations
            if (message.includes('[Violation] Added non-passive event listener') ||
                message.includes('Consider marking event handler as \'passive\'') ||
                message.includes('hcaptcha.html') ||
                message.includes('shared-e864a3e608739f9df23f774b6d751e03.js')) {
                return // Silently ignore - these are from external libraries
            }

            // Call original for all other info messages
            originalInfo.apply(console, args)
        }

        // Cleanup function
        return () => {
            console.log = originalLog
            console.warn = originalWarn
            console.info = originalInfo
        }
    }, [])

    return null // This component renders nothing
}