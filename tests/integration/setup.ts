/**
 * Integration Test Setup
 * 
 * Sets up the testing environment for integration tests that verify
 * interactions between different components of the system.
 */

import { createClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const testSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Import centralized test credentials
import { TEST_ACCOUNTS, TEST_EVENT_IDS } from '../../e2e/config/test-credentials';

// Test user data for consistent testing
export const TEST_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    email: TEST_ACCOUNTS.user.email,
    name: TEST_ACCOUNTS.user.displayName,
    password: TEST_ACCOUNTS.user.password
}

export const TEST_STAFF = {
    id: '00000000-0000-0000-0000-000000000002', 
    email: TEST_ACCOUNTS.staff.email,
    name: TEST_ACCOUNTS.staff.displayName,
    password: TEST_ACCOUNTS.staff.password
}

export const TEST_ADMIN = {
    id: '00000000-0000-0000-0000-000000000003',
    email: TEST_ACCOUNTS.admin.email,
    name: TEST_ACCOUNTS.admin.displayName, 
    password: TEST_ACCOUNTS.admin.password
}

export const TEST_EVENT = {
    id: TEST_EVENT_IDS.freeEvent,
    title: 'Test Event',
    description: 'A test event for integration testing',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    location: 'Test Location',
    max_attendees: 100,
    created_by: TEST_USER.id,
    status: 'published'
}

export const TEST_TICKET_TYPE = {
    id: '00000000-0000-0000-0000-000000000001',
    event_id: TEST_EVENT.id,
    name: 'General Admission',
    price: 2500, // $25.00 in cents
    quantity: 50,
    is_active: true
}

// Global setup and teardown
export const setupIntegrationTests = () => {
    beforeAll(async () => {
        console.log('🧪 Setting up integration test environment...')

        // Ensure test data exists in database
        await ensureTestData()
    })

    afterAll(async () => {
        console.log('🧹 Cleaning up integration test environment...')

        // Cleanup is handled by RLS policies in test environment
        // Test data is isolated by user/session
    })

    beforeEach(async () => {
        // Reset any test-specific state before each test
    })

    afterEach(async () => {
        // Clean up after each test if needed
    })
}

// Ensure test data exists in the database
export const ensureTestData = async () => {
    try {
        // Check if test event exists, create if not
        const { data: existingEvent, error: eventError } = await testSupabase
            .from('events')
            .select('id')
            .eq('id', TEST_EVENT.id)
            .single()

        if (!existingEvent && !eventError) {
            await testSupabase
                .from('events')
                .insert(TEST_EVENT)
        }

        // Check if test ticket type exists, create if not
        const { data: existingTicket, error: ticketError } = await testSupabase
            .from('ticket_types')
            .select('id')
            .eq('id', TEST_TICKET_TYPE.id)
            .single()

        if (!existingTicket && !ticketError) {
            await testSupabase
                .from('ticket_types')
                .insert(TEST_TICKET_TYPE)
        }

        console.log('✅ Test data ready')
    } catch (error) {
        console.warn('⚠️  Could not set up test data:', error)
        // Don't fail tests if test data setup fails - tests should handle missing data gracefully
    }
}

// Helper function to create authenticated test client
export const createAuthenticatedClient = (userId: string = TEST_USER.id) => {
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'X-Test-User-ID': userId
            }
        }
    })
}

// Mock Next.js request/response for API route testing
export const createMockRequest = (
    method: string = 'GET',
    url: string = 'http://localhost:3000/api/test',
    body?: any,
    headers: Record<string, string> = {}
) => {
    const request = new Request(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: body ? JSON.stringify(body) : undefined
    })

    return request as any // Type assertion for Next.js compatibility
}

// Database query helpers for testing
export const dbHelpers = {
    async getEvent(eventId: string) {
        const { data, error } = await testSupabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()

        if (error) throw error
        return data
    },

    async getTicketTypes(eventId: string) {
        const { data, error } = await testSupabase
            .from('ticket_types')
            .select('*')
            .eq('event_id', eventId)

        if (error) throw error
        return data
    },

    async getRSVPs(eventId: string) {
        const { data, error } = await testSupabase
            .from('rsvps')
            .select('*')
            .eq('event_id', eventId)

        if (error) throw error
        return data
    },

    async cleanupTestRSVPs(eventId: string = TEST_EVENT.id) {
        await testSupabase
            .from('rsvps')
            .delete()
            .eq('event_id', eventId)
    }
}

export default setupIntegrationTests 