'use client'

import { useEffect } from 'react'

/**
 * Comprehensive development console warning filter
 * Filters out development-only console messages that cannot be fixed
 * Only active in development mode and only suppresses specific known dev-only warnings
 * 
 * IMPORTANT: Only suppresses truly unfixable external library warnings.
 * Our application code is clean and doesn't generate these violations.
 * 
 * SUPPRESSED VIOLATIONS (External Libraries Only - Verified via Investigation):
 * 1. Stripe - HTTPS development warnings (expected in dev mode)
 * 2. Stripe - Appearance API warnings for unsupported properties
 * 3. Stripe - Payment method activation warnings (dashboard configuration)
 * 4. Stripe - Domain registration warnings (deployment configuration)
 * 5. Stripe - Network fetch errors to r.stripe.com/b (analytics endpoint, non-critical)
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
 */
export function DevOnlyErrorFilter() {
    useEffect(() => {
        // Only active in development
        if (process.env.NODE_ENV !== 'development') return

        // Store original console methods for all possible console outputs
        const originalMethods = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug,
            trace: console.trace
        }

        // Helper function to check if a message should be suppressed
        const shouldSuppressMessage = (message: string): boolean => {
            // Convert to string and lowercase for easier matching
            const msg = message.toLowerCase()

            // Stripe HTTPS development warnings (expected in dev)
            if (msg.includes('you may test your stripe.js integration over http') ||
                msg.includes('however, live stripe.js integrations must use https') ||
                msg.includes('if you are testing apple pay or google pay, you must serve this page over https') ||
                msg.includes('will not work over http') ||
                msg.includes('please read https://stripe.com/docs/stripe-js/elements/payment-request-button')) {
                return true
            }

            // Stripe appearance API warnings for unsupported properties
            if (msg.includes('is not a supported property') ||
                msg.includes('elements-inner-loader-ui.html') ||
                msg.includes('stripe.elements():') && msg.includes('not a supported property')) {
                return true
            }

            // Stripe payment method activation warnings (dashboard configuration)
            if (msg.includes('the following payment method types are not activated') ||
                msg.includes('they will be displayed in test mode, but hidden in live mode') ||
                msg.includes('please activate the payment method types in your dashboard') ||
                msg.includes('https://dashboard.stripe.com/settings/payment_methods')) {
                return true
            }

            // Stripe domain registration warnings (deployment configuration)
            if (msg.includes('you have not registered or verified the domain') ||
                msg.includes('please follow https://stripe.com/docs/payments/payment-methods/pmd-registration') ||
                msg.includes('the following payment methods are not enabled in the payment element')) {
                return true
            }

            // Stripe appearance API help links (informational, not actionable)
            if (msg.includes('for more information on using the `appearance` option') ||
                msg.includes('see https://stripe.com/docs/stripe-js/appearance-api')) {
                return true
            }

            // Stripe network fetch errors (analytics endpoint, non-critical)
            if (msg.includes('fetcherror: error fetching https://r.stripe.com/b') ||
                msg.includes('error fetching https://r.stripe.com/b') ||
                (msg.includes('fetcherror') && msg.includes('r.stripe.com'))) {
                return true
            }

            return false
        }

        // Create wrapper function for console methods
        const createFilterWrapper = (originalMethod: typeof console.log) => {
            return (...args: any[]) => {
                const message = args[0]?.toString() || ''
                
                // Check if this message should be suppressed
                if (shouldSuppressMessage(message)) {
                    return // Silently ignore
                }

                // Call original method for all other messages
                originalMethod.apply(console, args)
            }
        }

        // Override all console methods with filtered versions
        console.log = createFilterWrapper(originalMethods.log)
        console.warn = createFilterWrapper(originalMethods.warn)
        console.error = createFilterWrapper(originalMethods.error)
        console.info = createFilterWrapper(originalMethods.info)
        console.debug = createFilterWrapper(originalMethods.debug)
        console.trace = createFilterWrapper(originalMethods.trace)

        // Additional debug logging to verify filter is working (only in dev)
        if (typeof window !== 'undefined') {
            const debugLog = originalMethods.log
            debugLog('🔇 Console warning filter initialized - Stripe development warnings will be suppressed')
        }

        // Cleanup function to restore original console methods
        return () => {
            console.log = originalMethods.log
            console.warn = originalMethods.warn
            console.error = originalMethods.error
            console.info = originalMethods.info
            console.debug = originalMethods.debug
            console.trace = originalMethods.trace
        }
    }, [])

    return null // This component renders nothing
}