/**
 * Centralized Test Credentials Configuration
 * 
 * This file contains all test account credentials and configuration
 * used across E2E tests, integration tests, and test scripts.
 * 
 * Update this file to change test credentials globally.
 */

export interface TestAccount {
    email: string;
    password: string;
    role: 'user' | 'staff' | 'admin';
    displayName: string;
}

export interface GoogleTestAccount {
    email: string;
    password: string;
    displayName: string;
}

/**
 * Standard Login Test Accounts
 */
export const TEST_ACCOUNTS: Record<string, TestAccount> = {
    // Standard user account
    user: {
        email: 'test1@localloopevents.xyz',
        password: 'zunTom-9wizri-refdes',
        role: 'user',
        displayName: 'Test User'
    },
    
    // Staff account
    staff: {
        email: 'teststaff1@localloopevents.xyz', 
        password: 'bobvip-koDvud-wupva0',
        role: 'staff',
        displayName: 'Test Staff'
    },
    
    // Admin account
    admin: {
        email: 'testadmin1@localloopevents.xyz',
        password: 'nonhyx-1nopta-mYhnum',
        role: 'admin',
        displayName: 'Test Admin'
    }
} as const;

/**
 * Google OAuth Test Account
 */
export const GOOGLE_TEST_ACCOUNT: GoogleTestAccount = {
    email: 'TestLocalLoop@gmail.com',
    password: 'zowvok-8zurBu-xovgaj',
    displayName: 'Test LocalLoop'
} as const;

/**
 * Development Email Override
 * Used in development environment for email testing
 */
export const DEV_EMAIL_OVERRIDE = TEST_ACCOUNTS.user.email;

/**
 * Test Event IDs
 * Known test events in the database for E2E testing
 */
export const TEST_EVENT_IDS = {
    // Free event for RSVP testing
    freeEvent: '75c8904e-671f-426c-916d-4e275806e277',
    
    // Paid event for ticket purchase testing
    paidEvent: 'test-paid-event-id', // Update with actual test event ID
    
    // Past event for testing past events display
    pastEvent: 'test-past-event-id' // Update with actual test event ID
} as const;

/**
 * Helper functions for test account access
 */
export const getTestAccount = (role: 'user' | 'staff' | 'admin'): TestAccount => {
    return TEST_ACCOUNTS[role];
};

export const getGoogleTestAccount = (): GoogleTestAccount => {
    return GOOGLE_TEST_ACCOUNT;
};

export const getDevEmailOverride = (): string => {
    return DEV_EMAIL_OVERRIDE;
};

/**
 * Test data for form submissions
 */
export const TEST_FORM_DATA = {
    rsvp: {
        guestName: 'Test Guest User',
        guestEmail: TEST_ACCOUNTS.user.email,
        additionalGuests: ['Additional Guest 1', 'Additional Guest 2']
    },
    
    checkout: {
        customerInfo: {
            name: 'Test Customer',
            email: TEST_ACCOUNTS.user.email,
            phone: '+447400123456'
        }
    },
    
    event: {
        title: 'Test Event Title',
        description: 'Test event description for automated testing',
        location: 'Test Event Location',
        category: 'test'
    }
} as const;

/**
 * Load testing user configurations
 */
export const LOAD_TEST_USERS = [
    { email: TEST_ACCOUNTS.user.email, password: TEST_ACCOUNTS.user.password },
    { email: TEST_ACCOUNTS.staff.email, password: TEST_ACCOUNTS.staff.password },
    { email: TEST_ACCOUNTS.admin.email, password: TEST_ACCOUNTS.admin.password }
] as const;

/**
 * Export all for convenience
 */
export default {
    TEST_ACCOUNTS,
    GOOGLE_TEST_ACCOUNT,
    DEV_EMAIL_OVERRIDE,
    TEST_EVENT_IDS,
    TEST_FORM_DATA,
    LOAD_TEST_USERS,
    getTestAccount,
    getGoogleTestAccount,
    getDevEmailOverride
};
