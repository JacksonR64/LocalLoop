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
 * 2. Stripe - Network fetch errors to r.stripe.com/b (analytics endpoint, non-critical)
 * 
 * INVESTIGATION COMPLETED: Our application code is clean:
 * - No touchstart/touchmove/wheel event listeners in our code
 * - Uses IntersectionObserver instead of scroll listeners
 * - Uses scrollIntoView() for programmatic scrolling
 * - No React onTouch/onWheel handlers
 * 
 * PASSIVE EVENT LISTENER VIOLATIONS - UNFIXABLE:
 * - Violations come from hCaptcha loaded inside Stripe's secure iframe
 * - Cross-origin security prevents us from modifying iframe behavior
 * - Stripe loads hCaptcha for fraud prevention during checkout
 * - These are external library violations beyond our control
 * - Attempted fixes: default-passive-events library, addEventListener monkey patching
 * - Result: All attempts failed due to iframe isolation
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
 * 
 * STRIPE NETWORK FETCH ERRORS (r.stripe.com/b):
 * The r.stripe.com/b endpoint is used for Stripe's internal analytics/telemetry.
 * These fetch errors are common in development environments due to:
 * - Browser extensions blocking requests
 * - Network connectivity issues
 * - Development environment restrictions
 * These errors don't affect payment functionality and are safely suppressed.
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

            // Suppress Stripe Apple Pay/Google Pay HTTPS warnings (expected in dev)
            if (message.includes('If you are testing Apple Pay or Google Pay, you must serve this page over HTTPS') ||
                message.includes('will not work over HTTP') ||
                message.includes('Please read https://stripe.com/docs/stripe-js/elements/payment-request-button')) {
                return // Silently ignore - Apple/Google Pay requires HTTPS, expected in dev
            }

            // Suppress Stripe payment method activation warnings (configuration, not code)
            if (message.includes('The following payment method types are not activated') ||
                message.includes('They will be displayed in test mode, but hidden in live mode') ||
                message.includes('Please activate the payment method types in your dashboard')) {
                return // Silently ignore - Dashboard configuration, not code issue
            }

            // Suppress domain registration warnings for Apple Pay (configuration, not code)
            if (message.includes('You have not registered or verified the domain') ||
                message.includes('Please follow https://stripe.com/docs/payments/payment-methods/pmd-registration')) {
                return // Silently ignore - Domain registration is deployment config, not code
            }

            // Suppress Stripe appearance API help links (not actionable warnings)
            if (message.includes('For more information on using the `appearance` option') ||
                message.includes('see https://stripe.com/docs/stripe-js/appearance-api')) {
                return // Silently ignore - Just informational link, not a warning
            }

            // Call original for all other warnings
            originalWarn.apply(console, args)
        }

        // Override console.error to filter Stripe network errors
        console.error = (...args) => {
            const message = args[0]?.toString() || ''
            
            // Suppress Stripe network fetch errors (common in development)
            if (message.includes('FetchError: Error fetching https://r.stripe.com/b: Failed to fetch') ||
                message.includes('Error fetching https://r.stripe.com/b') ||
                (message.includes('FetchError') && message.includes('r.stripe.com'))) {
                return // Silently ignore - Stripe analytics endpoint failures are non-critical
            }

            // Call original for all other errors
            originalError.apply(console, args)
        }

        // Override console.info to catch violation messages that might come through info
        console.info = (...args) => {
            // const message = args[0]?.toString() || ''
            

            // Call original for all other info messages
            originalInfo.apply(console, args)
        }

        // Cleanup function
        return () => {
            console.log = originalLog
            console.warn = originalWarn
            console.error = originalError
            console.info = originalInfo
        }
    }, [])

    return null // This component renders nothing
}