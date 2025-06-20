import { Page, expect } from '@playwright/test';
import { TEST_ACCOUNTS, GOOGLE_TEST_ACCOUNT } from '../config/test-credentials';

/**
 * Authentication helper utilities for E2E tests
 * Provides robust authentication methods for different user types
 */
export class AuthHelpers {
    constructor(private page: Page) {}

    /**
     * Login with email and password (standard Supabase auth)
     */
    async loginWithEmail(email: string, password: string): Promise<void> {
        console.log(`Attempting email login for: ${email}`);
        
        // Navigate to login page
        await this.page.goto('/auth/login', { timeout: 15000, waitUntil: 'domcontentloaded' });
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch {
            // If networkidle fails, just wait for domcontentloaded
            await this.page.waitForLoadState('domcontentloaded');
        }

        // Wait for login form to be visible
        await expect(this.page.locator('form')).toBeVisible({ timeout: 10000 });

        // Fill email field using rock-solid data-testid selector
        const emailInput = this.page.locator('[data-testid="email-input"]');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        await emailInput.fill(email);

        // Fill password field using rock-solid data-testid selector
        const passwordInput = this.page.locator('[data-testid="password-input"]');
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
        await passwordInput.fill(password);

        // Submit the form using rock-solid data-testid selector
        const submitButton = this.page.locator('[data-testid="login-submit-button"]');
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        
        // Submit form with improved error handling for Mobile Safari
        try {
            await submitButton.click({ timeout: 8000 });
        } catch (error) {
            console.log(`Submit button click failed: ${error}, trying alternative approach`);
            // Alternative: use form submission directly (better for Mobile Safari)
            await this.page.locator('form').first().evaluate(form => form.submit());
        }
        
        // Additional fallback for Mobile Safari - try pressing Enter in password field
        if (await this.page.locator('input[type="password"]').isVisible()) {
            try {
                await this.page.locator('input[type="password"]').press('Enter');
                console.log('Tried Enter key submission as fallback');
            } catch {
                // Continue if Enter press fails
            }
        }
        
        // Wait for either redirect or auth state change
        try {
            // Try to wait for redirect away from login page
            await this.page.waitForURL(url => !url.includes('/auth/login'), { timeout: 15000 });
            console.log('✅ Redirected after login');
        } catch {
            // If no redirect, check if we're still on login page but auth state changed
            console.log('No redirect detected, checking auth state...');
            // Wait longer for auth to process
            await this.page.waitForTimeout(3000);
        }
        
        // Wait for auth state to settle and verify
        await this.waitForAuthState(10000);

        // Verify authentication was successful
        await this.verifyAuthenticated();
        console.log(`✅ Email login successful for: ${email}`);
    }

    /**
     * Login as standard test user
     */
    async loginAsUser(): Promise<void> {
        await this.loginWithEmail(TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    }

    /**
     * Login as staff user
     */
    async loginAsStaff(): Promise<void> {
        await this.loginWithEmail(TEST_ACCOUNTS.staff.email, TEST_ACCOUNTS.staff.password);
    }

    /**
     * Login as admin user
     */
    async loginAsAdmin(): Promise<void> {
        await this.loginWithEmail(TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    }

    /**
     * Simulate Google OAuth login flow
     * Note: This is a simplified mock for testing - real OAuth would involve external providers
     */
    async loginWithGoogle(): Promise<void> {
        console.log(`Attempting Google OAuth login for: ${GOOGLE_TEST_ACCOUNT.email}`);
        
        // Navigate to login page
        await this.page.goto('/auth/login', { timeout: 15000, waitUntil: 'domcontentloaded' });
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch {
            // If networkidle fails, just wait for domcontentloaded
            await this.page.waitForLoadState('domcontentloaded');
        }

        // Look for Google login button
        const googleButton = this.page.locator(
            'button:has-text("Google"), button:has-text("Continue with Google"), a:has-text("Google")'
        );

        if (await googleButton.isVisible({ timeout: 5000 })) {
            await googleButton.click();
            
            // In a real test, this would redirect to Google OAuth
            // For now, we simulate successful OAuth completion
            await this.page.waitForLoadState('networkidle', { timeout: 15000 });
            
            // Verify we're back from OAuth flow
            await this.verifyAuthenticated();
            console.log(`✅ Google OAuth login successful`);
        } else {
            console.warn('Google login button not found - falling back to email login');
            await this.loginWithEmail(GOOGLE_TEST_ACCOUNT.email, 'fallback-password');
        }
    }

    /**
     * Guest checkout flow (no authentication required)
     */
    async proceedAsGuest(): Promise<void> {
        console.log('Proceeding as guest user (no authentication)');
        
        // Ensure we're not authenticated
        if (await this.isAuthenticated()) {
            await this.logout();
        }
        
        console.log('✅ Guest mode confirmed');
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        console.log('Attempting to logout...');
        
        // Updated logout flow using rock-solid data-testid selectors
        let loggedOut = false;
        
        try {
            // Use rock-solid data-testid selector for profile button
            const profileButton = this.page.locator('[data-testid="profile-dropdown-button"]');
            
            if (await profileButton.isVisible({ timeout: 3000 })) {
                const buttonText = await profileButton.textContent();
                console.log(`Found profile button: "${buttonText}"`);
                
                // Check if dropdown is already open
                const dropdownMenu = this.page.locator('[data-testid="profile-dropdown-menu"]');
                const isDropdownOpen = await dropdownMenu.isVisible({ timeout: 500 });
                
                if (!isDropdownOpen) {
                    // Click to open dropdown if it's not already open
                    await profileButton.click();
                    console.log('Clicked profile button to open dropdown...');
                    
                    // Wait for dropdown menu to appear
                    await dropdownMenu.waitFor({ state: 'visible', timeout: 5000 });
                    console.log('Dropdown menu is now visible');
                } else {
                    console.log('Dropdown menu was already open');
                }
                
                // Look for Sign Out button using rock-solid data-testid
                const signOutButton = this.page.locator('[data-testid="profile-sign-out-button"]');
                await signOutButton.waitFor({ state: 'visible', timeout: 3000 });
                
                console.log('Sign Out button found, clicking...');
                await signOutButton.click();
                loggedOut = true;
                console.log('Sign Out clicked successfully');
                
            } else {
                console.log('Profile button not found using data-testid');
            }
        } catch (error) {
            console.log(`ProfileDropdown logout error: ${error}`);
        }

        // If ProfileDropdown logout failed, try fallback methods
        if (!loggedOut) {
            console.warn('Primary logout failed - trying fallback approaches');
            
            // Try clearing browser storage and reloading
            try {
                await this.page.evaluate(() => {
                    // Clear local storage and session storage
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Clear cookies if possible
                    document.cookie.split(";").forEach(function(c) { 
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                });
                
                // Navigate to homepage to trigger auth state refresh
                await this.page.goto('/', { timeout: 15000, waitUntil: 'domcontentloaded' });
                await this.page.waitForLoadState('networkidle', { timeout: 5000 });
                loggedOut = true;
                console.log('Logout completed via storage clearing');
            } catch (error) {
                console.log(`Storage clearing failed: ${error}`);
                
                // Final fallback: try logout endpoint
                try {
                    await this.page.goto('/auth/logout', { timeout: 15000, waitUntil: 'domcontentloaded' });
                    await this.page.waitForLoadState('networkidle', { timeout: 5000 });
                    loggedOut = true;
                    console.log('Logout completed via endpoint');
                } catch (endpointError) {
                    console.log(`Logout endpoint failed: ${endpointError}`);
                }
            }
        } else {
            // Wait for logout to complete
            try {
                await this.page.waitForLoadState('networkidle', { timeout: 3000 });
            } catch {
                await this.page.waitForLoadState('domcontentloaded');
                await this.page.waitForTimeout(1000);
            }
        }
        
        // Wait for auth state to propagate and UI to update
        console.log('Waiting for auth state to update...');
        await this.page.waitForTimeout(3000);
        
        // Force a navigation to ensure auth state is refreshed
        await this.page.goto(this.page.url(), { timeout: 15000, waitUntil: 'domcontentloaded' });
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 3000 });
        } catch {
            // If networkidle fails, just wait for domcontentloaded - this prevents timeouts
            await this.page.waitForLoadState('domcontentloaded');
            await this.page.waitForTimeout(1000); // Small delay to let auth state settle
        }
        
        // Verify we're logged out
        await this.verifyLoggedOut();
        console.log('✅ Logout successful');
    }

    /**
     * Check if user is currently authenticated
     * Handles both desktop and mobile viewports
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            // Check viewport size to determine if we're on mobile
            const viewportSize = this.page.viewportSize();
            const isMobile = viewportSize && viewportSize.width < 768; // md breakpoint
            
            // Primary method: Check if Sign In link IS present (indicates logged out)
            // With new mobile nav, sign in link is always visible in top bar
            let signInSelector = '[data-testid="sign-in-link"]';
            if (isMobile) {
                signInSelector = '[data-testid="mobile-sign-in-link"]';
            }
            
            const signInLink = this.page.locator(signInSelector);
            const hasSignInLink = await signInLink.isVisible({ timeout: 3000 });
            
            if (hasSignInLink) {
                console.log('❌ Not authenticated: Sign In link is present');
                return false;
            }
            
            // Secondary check: Look for authenticated user elements using rock-solid data-testid
            // With new mobile nav, ProfileDropdown is always visible in top bar (no need to open menu)
            const userElements = [
                // ProfileDropdown button - most reliable indicator
                isMobile ? '[data-testid="mobile-profile-dropdown-button"]' : '[data-testid="desktop-profile-dropdown-button"]',
                // User role badge for staff/admin  
                '[data-testid="user-role-badge"]',
                // Navigation elements only available to authenticated users
                '[data-testid="my-events-link"]',
                '[data-testid="mobile-my-events-link"]', // Mobile variant
                '[data-testid="profile-display-name"]'
            ];

            for (const selector of userElements) {
                try {
                    const element = this.page.locator(selector);
                    if (await element.isVisible({ timeout: 1000 })) {
                        console.log(`✅ Authentication detected via element: ${selector}`);
                        return true;
                    }
                } catch {
                    continue;
                }
            }

            console.log('❌ No authentication detected - no user elements found');
            return false;
        } catch (error) {
            console.log(`❌ Authentication check error: ${error}`);
            return false;
        }
    }

    /**
     * Verify user is authenticated (assertion)
     */
    async verifyAuthenticated(): Promise<void> {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            // Take screenshot for debugging
            await this.page.screenshot({ 
                path: `test-results/auth-failed-${Date.now()}.png`,
                fullPage: true 
            });
            throw new Error('User authentication verification failed');
        }
        
        console.log('✅ User authentication verified');
    }

    /**
     * Verify user is logged out (assertion)
     */
    async verifyLoggedOut(): Promise<void> {
        const isAuth = await this.isAuthenticated();
        if (isAuth) {
            throw new Error('User logout verification failed - still appears authenticated');
        }
        
        console.log('✅ User logout verified');
    }

    /**
     * Get current user display name (if authenticated)
     */
    async getCurrentUserName(): Promise<string | null> {
        try {
            // Use rock-solid data-testid selectors
            const nameSelectors = [
                '[data-testid="profile-display-name"]',
                '[data-testid="profile-name"]'
            ];

            for (const selector of nameSelectors) {
                const element = this.page.locator(selector);
                if (await element.isVisible({ timeout: 2000 })) {
                    const text = await element.textContent();
                    if (text && text.trim()) {
                        return text.trim();
                    }
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Wait for authentication state to be resolved
     * Enhanced for post-refresh scenarios
     */
    async waitForAuthState(timeout: number = 15000): Promise<void> {
        const startTime = Date.now();
        
        // First, wait for page to be fully loaded after refresh
        try {
            await this.page.waitForLoadState('domcontentloaded');
            await this.page.waitForTimeout(1000); // Give Supabase auth time to initialize
        } catch {
            // Continue if load state fails
        }
        
        while (Date.now() - startTime < timeout) {
            try {
                // Check if auth state is resolved by looking for either auth indicators or login forms
                const hasAuthIndicator = await this.isAuthenticated();
                const hasLoginForm = await this.page.locator('form input[type="email"]').isVisible({ timeout: 1000 });
                
                if (hasAuthIndicator || hasLoginForm) {
                    console.log('✅ Auth state resolved');
                    // Extra wait to ensure auth state is stable
                    await this.page.waitForTimeout(1000);
                    return;
                }
                
                await this.page.waitForTimeout(1000); // Increased wait time for auth recovery
            } catch {
                await this.page.waitForTimeout(1000);
            }
        }
        
        console.warn('Auth state resolution timed out');
    }

    /**
     * Setup authentication for a specific test scenario
     */
    async setupAuth(userType: 'guest' | 'user' | 'staff' | 'admin' | 'google'): Promise<void> {
        console.log(`Setting up authentication for: ${userType}`);
        
        switch (userType) {
            case 'guest':
                await this.proceedAsGuest();
                break;
            case 'user':
                await this.loginAsUser();
                break;
            case 'staff':
                await this.loginAsStaff();
                break;
            case 'admin':
                await this.loginAsAdmin();
                break;
            case 'google':
                await this.loginWithGoogle();
                break;
            default:
                throw new Error(`Unknown user type: ${userType}`);
        }
    }

    /**
     * Clean up authentication state (logout if needed)
     */
    async cleanupAuth(): Promise<void> {
        if (await this.isAuthenticated()) {
            await this.logout();
        }
    }
}

/**
 * Helper function to create auth helpers instance
 */
export function createAuthHelpers(page: Page): AuthHelpers {
    return new AuthHelpers(page);
}

/**
 * Common authentication patterns for different test scenarios
 */
export const AuthPatterns = {
    // Free event RSVP tests
    freeEventRSVP: {
        guest: 'guest' as const,
        user: 'user' as const
    },
    
    // Paid event ticket purchase tests
    paidEventTickets: {
        guest: 'guest' as const,
        user: 'user' as const
    },
    
    // Staff/admin functionality tests
    staffOperations: {
        staff: 'staff' as const,
        admin: 'admin' as const
    },
    
    // Google Calendar integration tests
    calendarIntegration: {
        google: 'google' as const,
        user: 'user' as const
    },
    
    // Dashboard and profile tests
    userDashboard: {
        user: 'user' as const,
        staff: 'staff' as const,
        admin: 'admin' as const
    }
} as const;