import { z } from 'zod'

/**
 * Security validation utilities for authentication flows
 */

// UUID v4 validation for user IDs
export const userIdSchema = z.string().uuid('Invalid user ID format')

// OAuth state validation
export const oAuthStateSchema = z.object({
    userId: userIdSchema,
    returnUrl: z.string().url().optional(),
    action: z.enum(['connect', 'create_event', 'sync']).optional()
})

// Authorization code validation (Google OAuth)
export const authCodeSchema = z.string()
    .min(10, 'Authorization code too short')
    .max(500, 'Authorization code too long')
    .regex(/^[a-zA-Z0-9\-_.\/]+$/, 'Invalid authorization code format')

// Email validation with stricter rules
export const emailSchema = z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(254, 'Email too long')
    .refine(email => !email.includes('..'), 'Invalid email format')

// Password validation for strong security
export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number')

// URL validation for redirects (prevent open redirects)
export const redirectUrlSchema = z.string()
    .url('Invalid URL format')
    .refine(url => {
        // Only allow same origin or whitelisted domains
        const allowedOrigins = [
            process.env.NEXT_PUBLIC_APP_URL,
            process.env.NEXT_PUBLIC_BASE_URL,
            'http://localhost:3000',
            'https://local-loop-qa.vercel.app'
        ].filter(Boolean)
        
        return allowedOrigins.some(origin => url.startsWith(origin!))
    }, 'Redirect URL not allowed')

/**
 * Validate user ID with security checks
 */
export function validateUserId(userId: unknown): string {
    const result = userIdSchema.safeParse(userId)
    if (!result.success) {
        throw new Error(`Invalid user ID: ${result.error.message}`)
    }
    return result.data
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(state: unknown): z.infer<typeof oAuthStateSchema> {
    const result = oAuthStateSchema.safeParse(state)
    if (!result.success) {
        throw new Error(`Invalid OAuth state: ${result.error.message}`)
    }
    return result.data
}

/**
 * Validate authorization code
 */
export function validateAuthCode(code: unknown): string {
    const result = authCodeSchema.safeParse(code)
    if (!result.success) {
        throw new Error(`Invalid authorization code: ${result.error.message}`)
    }
    return result.data
}

/**
 * Validate email address
 */
export function validateEmail(email: unknown): string {
    const result = emailSchema.safeParse(email)
    if (!result.success) {
        throw new Error(`Invalid email: ${result.error.message}`)
    }
    return result.data
}

/**
 * Validate password strength
 */
export function validatePassword(password: unknown): string {
    const result = passwordSchema.safeParse(password)
    if (!result.success) {
        throw new Error(`Invalid password: ${result.error.message}`)
    }
    return result.data
}

/**
 * Validate redirect URL (prevent open redirect attacks)
 */
export function validateRedirectUrl(url: unknown): string {
    const result = redirectUrlSchema.safeParse(url)
    if (!result.success) {
        throw new Error(`Invalid redirect URL: ${result.error.message}`)
    }
    return result.data
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string, maxLength = 1000): string {
    return input
        .replace(/[<>\"'&]/g, '') // Remove potential XSS characters
        .trim()
        .slice(0, maxLength)
}

/**
 * Rate limiting token bucket for authentication endpoints
 */
export class RateLimiter {
    private buckets = new Map<string, { count: number; lastReset: number }>()
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute default
        this.maxRequests = maxRequests
        this.windowMs = windowMs
    }

    /**
     * Check if request is allowed for given identifier
     */
    isAllowed(identifier: string): boolean {
        const now = Date.now()
        const bucket = this.buckets.get(identifier)

        if (!bucket || now - bucket.lastReset > this.windowMs) {
            this.buckets.set(identifier, { count: 1, lastReset: now })
            return true
        }

        if (bucket.count >= this.maxRequests) {
            return false
        }

        bucket.count++
        return true
    }

    /**
     * Clean up old buckets to prevent memory leaks
     */
    cleanup(): void {
        const now = Date.now()
        for (const [key, bucket] of this.buckets) {
            if (now - bucket.lastReset > this.windowMs * 2) {
                this.buckets.delete(key)
            }
        }
    }
}

// Global rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(5, 60000) // 5 auth attempts per minute
export const oauthRateLimiter = new RateLimiter(10, 300000) // 10 OAuth attempts per 5 minutes

// Cleanup rate limiters every 5 minutes
setInterval(() => {
    authRateLimiter.cleanup()
    oauthRateLimiter.cleanup()
}, 300000)