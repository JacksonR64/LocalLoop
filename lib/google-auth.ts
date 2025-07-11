import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
    GoogleCalendarService,
    GoogleCalendarTokens,
    areTokensExpired,
    createGoogleCalendarService
} from './google-calendar'
import { User } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * Interface for Google Calendar OAuth state
 */
export interface GoogleAuthState {
    userId: string
    returnUrl?: string
    action?: 'connect' | 'create_event' | 'sync'
}

/**
 * Interface for encrypted token storage in database
 */
export interface EncryptedCalendarTokens {
    encrypted_data: string
    created_at: string
    updated_at: string
    expires_at: string
}

/**
 * Google Calendar OAuth Integration Service
 * Handles OAuth flow, token storage, and calendar access management
 */
export class GoogleCalendarAuth {
    private calendarService: GoogleCalendarService

    constructor() {
        this.calendarService = createGoogleCalendarService()
    }

    /**
     * Start OAuth 2.0 authorization flow
     * @param user - Current Supabase user
     * @param options - OAuth flow options
     * @returns Authorization URL for user consent
     */
    async startOAuthFlow(
        user: User,
        options: {
            returnUrl?: string
            action?: 'connect' | 'create_event' | 'sync'
        } = {}
    ): Promise<string> {
        if (!user) {
            throw new Error('User must be authenticated to start Google Calendar OAuth flow')
        }

        // Create state parameter with user info for security
        const state: GoogleAuthState = {
            userId: user.id,
            returnUrl: options.returnUrl || '/dashboard',
            action: options.action || 'connect',
        }

        const stateString = Buffer.from(JSON.stringify(state)).toString('base64url')

        return this.calendarService.getAuthUrl(stateString)
    }

    /**
     * Complete OAuth 2.0 flow and store tokens
     * @param code - Authorization code from Google
     * @param state - State parameter from OAuth flow
     * @returns User info and success status
     */
    async completeOAuthFlow(
        code: string,
        state: string
    ): Promise<{
        success: boolean
        user?: User
        returnUrl?: string
        action?: string
        error?: string
    }> {
        try {
            // Decode and validate state parameter
            const authState: GoogleAuthState = JSON.parse(
                Buffer.from(state, 'base64url').toString()
            )

            // Get tokens from Google
            const tokens = await this.calendarService.getTokensFromCode(code)

            // Store tokens securely in database
            await this.storeUserTokens(authState.userId, tokens)

            // Get user info for response using server client
            const supabaseServer = await createServerSupabaseClient()
            const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

            if (userError || !user) {
                throw new Error('Failed to get user information after OAuth completion')
            }

            return {
                success: true,
                user,
                returnUrl: authState.returnUrl,
                action: authState.action,
            }
        } catch (error) {
            console.error('Error completing Google Calendar OAuth flow:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            }
        }
    }

    /**
     * Store user's Google Calendar tokens securely in database
     * @param userId - Supabase user ID
     * @param tokens - Google Calendar tokens to encrypt and store
     */
    async storeUserTokens(userId: string, tokens: GoogleCalendarTokens): Promise<void> {
        try {
            // Encrypt tokens using AES-256-GCM for security
            const encryptedTokens = this.encryptTokens(tokens)

            // Security audit log (safe for production)
            if (process.env.NODE_ENV === 'development') {
                console.log('Storing Google Calendar tokens for user', {
                    userId: userId.slice(0, 8) + '...',
                    tokenTypes: Object.keys(tokens),
                    hasRefreshToken: !!tokens.refresh_token,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                    timestamp: new Date().toISOString()
                })
            }

            const supabaseServer = await createServerSupabaseClient()

            const { error } = await supabaseServer
                .from('users')
                .update({
                    google_calendar_token: encryptedTokens,
                    google_calendar_connected: true,
                    google_calendar_connected_at: new Date().toISOString(),
                    google_calendar_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (error) {
                console.error('Error storing Google Calendar tokens:', error)
                throw new Error('Failed to store Google Calendar tokens')
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('Successfully stored encrypted Google Calendar tokens', {
                    userId: userId.slice(0, 8) + '...',
                    storedAt: new Date().toISOString()
                })
            }

        } catch (error) {
            console.error('Error in storeUserTokens:', error)
            throw error
        }
    }

    /**
     * Get user's Google Calendar tokens from database
     * @param userId - Supabase user ID
     * @returns Decrypted tokens or null if not found
     */
    async getUserTokens(userId: string): Promise<GoogleCalendarTokens | null> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { data, error } = await supabaseServer
                .from('users')
                .select('google_calendar_token, google_calendar_connected, google_calendar_expires_at')
                .eq('id', userId)
                .single()

            if (error || !data?.google_calendar_token || !data.google_calendar_connected) {
                return null
            }

            // Security audit log - token access (safe for production)
            // Removed verbose logging to clean up dev server output

            // Decrypt tokens using AES-256-GCM
            const tokens = this.decryptTokens(data.google_calendar_token)

            return tokens
        } catch (error) {
            console.warn('[WARN] getUserTokens - Failed to get user Google Calendar tokens (likely corrupted/expired):', error instanceof Error ? error.message : String(error))
            return null
        }
    }

    /**
     * Encrypt tokens using AES-256-GCM
     * @param tokens - Tokens to encrypt
     * @returns Encrypted token string
     */
    private encryptTokens(tokens: GoogleCalendarTokens): string {
        try {
            const algorithm = 'aes-256-gcm'

            // SECURITY: Encryption key MUST be set in production
            const encryptionKey = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY
            if (!encryptionKey) {
                if (process.env.NODE_ENV === 'production') {
                    throw new Error('GOOGLE_CALENDAR_ENCRYPTION_KEY must be set in production environment')
                }
                // Only use fallback in development
                console.warn('WARNING: Using development encryption key. Set GOOGLE_CALENDAR_ENCRYPTION_KEY in production.')
            }

            const finalKey = encryptionKey || 'dev-fallback-key-must-be-32-chars'
            // Ensure key is exactly 32 bytes for AES-256
            const key = crypto.scryptSync(finalKey, 'encryption-salt-localloop', 32)

            // Generate random IV for each encryption
            const iv = crypto.randomBytes(16)

            const cipher = crypto.createCipheriv(algorithm, key, iv)

            let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex')
            encrypted += cipher.final('hex')

            const authTag = cipher.getAuthTag()

            // Combine IV, auth tag, and encrypted data
            const result = {
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                encrypted: encrypted
            }

            return Buffer.from(JSON.stringify(result)).toString('base64')
        } catch (error) {
            console.error('Token encryption failed:', error)
            throw new Error('Failed to encrypt tokens')
        }
    }

    /**
     * Decrypt tokens using AES-256-GCM
     * @param encryptedData - Encrypted token string
     * @returns Decrypted tokens
     */
    private decryptTokens(encryptedData: string): GoogleCalendarTokens {
        try {
            const algorithm = 'aes-256-gcm'

            // SECURITY: Encryption key MUST be set in production
            const encryptionKey = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY
            if (!encryptionKey) {
                if (process.env.NODE_ENV === 'production') {
                    throw new Error('GOOGLE_CALENDAR_ENCRYPTION_KEY must be set in production environment')
                }
            }

            const finalKey = encryptionKey || 'dev-fallback-key-must-be-32-chars'
            // Ensure key is exactly 32 bytes for AES-256 (must match encryption)
            const key = crypto.scryptSync(finalKey, 'encryption-salt-localloop', 32)

            // Parse encrypted data
            const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString())

            const decipher = crypto.createDecipheriv(
                algorithm,
                key,
                Buffer.from(data.iv, 'hex')
            )

            decipher.setAuthTag(Buffer.from(data.authTag, 'hex'))

            let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
            decrypted += decipher.final('utf8')

            return JSON.parse(decrypted)
        } catch (error) {
            console.warn('Token decryption failed - likely corrupted/old format tokens:', error instanceof Error ? error.message : String(error))
            throw new Error('Failed to decrypt tokens')
        }
    }

    /**
     * Get user's Google Calendar service with valid tokens
     * @param userId - Supabase user ID
     * @returns Configured calendar service or null if not connected
     */
    async getUserCalendarService(userId: string): Promise<GoogleCalendarService | null> {
        try {
            let tokens = await this.getUserTokens(userId)

            if (!tokens) {
                return null
            }

            // Check if tokens need refresh
            if (areTokensExpired(tokens)) {
                if (!tokens.refresh_token) {
                    // No refresh token available, user needs to re-authenticate
                    await this.disconnectUserCalendar(userId)
                    return null
                }

                // Refresh tokens
                this.calendarService.setCredentials(tokens)
                const newTokens = await this.calendarService.refreshTokens()

                // Store updated tokens
                await this.storeUserTokens(userId, newTokens)
                tokens = newTokens
            }

            // Create new service instance with valid tokens
            const service = createGoogleCalendarService()
            service.setCredentials(tokens)

            return service
        } catch (error) {
            console.error('Error getting user calendar service:', error)
            // Don't auto-disconnect on errors - let user manually disconnect if needed
            // Common causes: expired refresh tokens, revoked access, OAuth config changes
            return null
        }
    }

    /**
     * Disconnect user's Google Calendar
     * @param userId - Supabase user ID
     */
    async disconnectUserCalendar(userId: string): Promise<void> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { error } = await supabaseServer
                .from('users')
                .update({
                    google_calendar_token: null,
                    google_calendar_connected: false,
                    google_calendar_connected_at: null,
                    google_calendar_expires_at: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (error) {
                console.error('Error disconnecting Google Calendar:', error)
                throw new Error('Failed to disconnect Google Calendar')
            }
        } catch (error) {
            console.error('Error in disconnectUserCalendar:', error)
            throw error
        }
    }

    /**
     * Check if user has connected Google Calendar
     * @param userId - Supabase user ID
     * @returns Connection status and details
     */
    async getConnectionStatus(userId: string): Promise<{
        connected: boolean
        connectedAt?: string
        expiresAt?: string
        syncEnabled?: boolean
    }> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { data, error } = await supabaseServer
                .from('users')
                .select(`
          google_calendar_connected,
          google_calendar_connected_at,
          google_calendar_expires_at
        `)
                .eq('id', userId)
                .single()


            if (error || !data) {
                return { connected: false }
            }

            const result = {
                connected: data.google_calendar_connected || false,
                connectedAt: data.google_calendar_connected_at,
                expiresAt: data.google_calendar_expires_at,
                syncEnabled: false, // Default to false since column doesn't exist yet
            }

            return result
        } catch (error) {
            console.error('Error getting Google Calendar connection status:', error)
            return { connected: false }
        }
    }

    /**
     * Test user's Google Calendar connection
     * @param userId - Supabase user ID
     * @returns Connection test results
     */
    async testUserConnection(userId: string): Promise<{
        connected: boolean
        primaryCalendar?: string
        error?: string
    }> {
        try {
            const calendarService = await this.getUserCalendarService(userId)

            if (!calendarService) {
                return {
                    connected: false,
                    error: 'Google Calendar not connected or tokens expired',
                }
            }

            return await calendarService.testConnection()
        } catch (error) {
            console.error('Error testing Google Calendar connection:', error)
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Connection test failed',
            }
        }
    }

    /**
     * Enable/disable automatic calendar sync for user
     * @param userId - Supabase user ID
     * @param enabled - Whether to enable sync
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async setSyncEnabled(userId: string, enabled: boolean): Promise<void> {
        try {
            // Note: google_calendar_sync_enabled column doesn't exist yet
            // This method is a placeholder for future implementation
            console.warn('setSyncEnabled: google_calendar_sync_enabled column not implemented yet')
        } catch (error) {
            console.error('Error in setSyncEnabled:', error)
            throw error
        }
    }

    /**
     * Create a calendar event for user
     * @param userId - Supabase user ID
     * @param eventData - Event details
     * @returns Created event information
     */
    async createEventForUser(
        userId: string,
        eventData: {
            title: string
            description?: string
            location?: string
            startDate: Date
            endDate: Date
            attendeeEmails?: string[]
        }
    ): Promise<{ success: boolean; eventId?: string; error?: string }> {
        try {
            const calendarService = await this.getUserCalendarService(userId)

            if (!calendarService) {
                return {
                    success: false,
                    error: 'Google Calendar access expired or invalid. Please reconnect your calendar.',
                }
            }

            const { convertToGoogleCalendarEvent } = await import('./google-calendar')
            const googleEvent = convertToGoogleCalendarEvent(eventData)

            const createdEvent = await calendarService.createEvent('primary', googleEvent)

            return {
                success: true,
                eventId: createdEvent.id || undefined,
            }
        } catch (error) {
            console.error('Error creating calendar event for user:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create calendar event',
            }
        }
    }
}

/**
 * Create a new Google Calendar Auth service instance
 */
export function createGoogleCalendarAuth(): GoogleCalendarAuth {
    return new GoogleCalendarAuth()
}

/**
 * Utility function to generate OAuth state parameter
 * @param userId - User ID
 * @param returnUrl - URL to return to after OAuth
 * @param action - Action being performed
 * @returns Base64 encoded state
 */
export function createOAuthState(
    userId: string,
    returnUrl?: string,
    action?: 'connect' | 'create_event' | 'sync'
): string {
    const state: GoogleAuthState = {
        userId,
        returnUrl: returnUrl || '/dashboard',
        action: action || 'connect',
    }

    return Buffer.from(JSON.stringify(state)).toString('base64url')
}

/**
 * Utility function to parse OAuth state parameter
 * @param state - Base64 encoded state
 * @returns Parsed state object
 */
export function parseOAuthState(state: string): GoogleAuthState {
    try {
        return JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
        throw new Error('Invalid OAuth state parameter')
    }
} 