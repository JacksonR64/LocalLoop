'use client'

import { useEffect } from 'react'

/**
 * Filters out development-only console messages that cannot be fixed
 * Only active in development mode and only suppresses specific known dev-only warnings
 * 
 * IMPORTANT: Only suppresses truly unfixable external library warnings.
 * Our application code is clean and doesn't generate these violations.
 * 
 * SUPPRESSED VIOLATIONS (External Libraries Only - Verified via Investigation):
 * 1. Stripe - HTTPS development warnings (expected in dev mode)
 * 
 * INVESTIGATION COMPLETED: Our application code is clean:
 * - No touchstart/touchmove/wheel event listeners in our code
 * - Uses IntersectionObserver instead of scroll listeners
 * - Uses scrollIntoView() for programmatic scrolling
 * - No React onTouch/onWheel handlers
 * 
 * PASSIVE EVENT LISTENER VIOLATIONS - FIXED:
 * - Implemented default-passive-events library (imported in app/layout.tsx)
 * - This automatically makes all touchstart/touchmove/wheel/mousewheel events passive
 * - No more suppressions needed - violations are properly fixed at source
 * 
 * TO INVESTIGATE NEW VIOLATIONS:
 * 1. Check browser console for full stack trace
 * 2. Look for library names in the stack trace 
 * 3. Search codebase: grep -r "addEventListener.*touchstart\|wheel\|touchmove"
 * 4. If found in our code, add { passive: true } option
 * 
 * ARIA-HIDDEN ACCESSIBILITY WARNING (External Component):
 * If you see "Blocked aria-hidden on an element because its descendant retained focus"
 * with CodePuncher component, this is from Stripe's payment verification input.
 * This is an external component accessibility issue that we cannot fix in our code.
 * 
 * STRIPE PAYMENT METHOD WARNINGS:
 * If you see "payment method types are not activated" warnings, these are 
 * CONFIGURATION issues in your Stripe Dashboard, not code issues. 
 * Go to: Stripe Dashboard > Settings > Payment methods to activate needed methods.
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


            // Call original for all other warnings
            originalWarn.apply(console, args)
        }

        // Override console.info to catch violation messages that might come through info
        console.info = (...args) => {
            const message = args[0]?.toString() || ''
            

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