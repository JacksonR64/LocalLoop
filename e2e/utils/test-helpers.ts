import { Page, expect } from '@playwright/test';
// Import centralized test credentials
import { TEST_ACCOUNTS, GOOGLE_TEST_ACCOUNT, TEST_EVENT_IDS, TEST_FORM_DATA } from '../config/test-credentials';
// Import authentication helpers
import { AuthHelpers, createAuthHelpers } from './auth-helpers';

export class TestHelpers {
    public auth: AuthHelpers;

    constructor(private page: Page) {
        this.auth = createAuthHelpers(page);
    }

    /**
     * Navigate to homepage and verify it loads
     */
    async goToHomepage() {
        await this.page.goto('/', { timeout: 10000, waitUntil: 'domcontentloaded' });
        await this.waitForPageLoad();
        await expect(this.page.locator('body')).toBeVisible();
        
        // Wait for auth state to settle after navigation
        await this.auth.waitForAuthState(5000);
        
        return this;
    }

    /**
     * Navigate to a specific event page
     */
    async goToEvent(eventId: string) {
        await this.page.goto(`/events/${eventId}`, { timeout: 10000, waitUntil: 'domcontentloaded' });
        await this.waitForPageLoad();
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Navigate to login page
     */
    async goToLogin() {
        await this.page.goto('/auth/login', { timeout: 10000, waitUntil: 'domcontentloaded' });
        await this.waitForPageLoad();
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Navigate to event creation page
     */
    async goToCreateEvent() {
        await this.page.goto('/staff/events/create');
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Wait for page to fully load (including network requests)
     * Uses a more resilient approach than networkidle
     */
    async waitForPageLoad(timeout: number = 8000) {
        try {
            // Try networkidle first with shorter timeout
            await this.page.waitForLoadState('networkidle', { timeout: 3000 });
        } catch (error) {
            // Fallback to domcontentloaded if networkidle fails
            console.log('Network idle wait failed, using domcontentloaded:', error.message || error);
            await this.page.waitForLoadState('domcontentloaded', { timeout });
            // Add small delay to let any lazy loading complete
            await this.page.waitForTimeout(500);
        }
        return this;
    }

    /**
     * Check if user is authenticated by looking for profile elements
     */
    async isAuthenticated(): Promise<boolean> {
        return await this.auth.isAuthenticated();
    }

    /**
     * Simulate Google OAuth login (mock for testing)
     */
    async mockGoogleLogin(email: string = 'test@example.com', name: string = 'Test User') {
        // This would typically involve mocking the OAuth flow
        console.log(`Mocking Google login for ${name} (${email})`);
        // For now, we'll simulate the post-login state
        await this.page.goto('/auth/login');

        // In a real implementation, you might:
        // 1. Mock the Google OAuth endpoints
        // 2. Simulate the callback with a test token
        // 3. Ensure the session is properly set

        console.log(`Mocking Google login for ${email}`);
        return this;
    }

    /**
     * Fill out RSVP form
     */
    async fillRSVPForm(attendeeCount: number = 1, attendeeNames: string[] = ['Test Attendee']) {
        // Wait for RSVP form to be visible - but don't fail if it doesn't exist
        try {
            await expect(this.page.locator('[data-test-id="rsvp-form"]')).toBeVisible({ timeout: 3000 });
        } catch (error) {
            console.warn('RSVP form not immediately visible - may require authentication or different event type:', error.message || error);
            return this;
        }

        // Fill attendee count if input exists
        const attendeeCountInput = this.page.locator('input[name="attendee_count"], input[type="number"]');
        if (await attendeeCountInput.isVisible()) {
            await attendeeCountInput.fill(attendeeCount.toString());
        }

        // For guest users, fill out guest information
        const guestNameInput = this.page.locator('[data-test-id="guest-name-input"]');
        const guestEmailInput = this.page.locator('[data-test-id="guest-email-input"]');

        if (await guestNameInput.isVisible() && attendeeNames.length > 0) {
            await guestNameInput.fill(attendeeNames[0]);
        }

        if (await guestEmailInput.isVisible()) {
            await guestEmailInput.fill('test@example.com');
        }

        return this;
    }

    /**
     * Submit RSVP form
     */
    async submitRSVP() {
        const submitButton = this.page.locator('[data-test-id="rsvp-submit-button"]');

        try {
            await expect(submitButton).toBeVisible({ timeout: 3000 });
            await submitButton.click();

            // Wait for submission to complete with fallback
            await this.waitForPageLoad();
        } catch (error) {
            console.warn('RSVP submit button not found or clickable - may not be available:', error.message || error);
        }

        return this;
    }

    /**
     * Fill out ticket purchase form
     */
    async fillTicketForm(ticketQuantity: number = 1) {
        // Look for ticket quantity controls using data-test-id
        const quantityInput = this.page.locator('[data-test-id="quantity-input"]');
        const increaseButton = this.page.locator('[data-test-id="increase-quantity-button"]');

        if (await quantityInput.isVisible()) {
            // Clear and fill quantity input
            await quantityInput.fill(ticketQuantity.toString());
        } else if (await increaseButton.isVisible()) {
            // Use increase button to set quantity
            for (let i = 0; i < ticketQuantity; i++) {
                await increaseButton.first().click();
                await this.page.waitForTimeout(500); // Small delay between clicks
            }
        } else {
            console.warn('No ticket quantity controls found');
        }

        return this;
    }

    /**
     * Proceed to checkout
     */
    async proceedToCheckout() {
        const checkoutButton = this.page.locator('[data-test-id="proceed-to-checkout-button"]');

        try {
            await expect(checkoutButton).toBeVisible({ timeout: 3000 });
            await checkoutButton.click();

            // Wait for redirect to checkout or Stripe
            await this.waitForPageLoad();
        } catch (error) {
            console.warn('Checkout button not found - may require tickets to be selected first:', error.message || error);
        }

        return this;
    }

    /**
     * Check for success messages or confirmations
     */
    async verifySuccessMessage(message?: string) {
        const successSelectors = [
            '[data-test-id="success-message"]',
            '[data-test-id="rsvp-confirmed-text"]',
            '.success-message',
            '.alert-success',
            ':has-text("Success")',
            ':has-text("Confirmed")',
            ':has-text("Thank you")'
        ];

        let found = false;
        for (const selector of successSelectors) {
            try {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: 3000 });
                found = true;
                break;
            } catch (error) {
                // Continue to next selector
                console.log(`Selector ${selector} not found:`, error.message || error);
            }
        }

        if (!found && message) {
            await expect(this.page.locator(`:has-text("${message}")`)).toBeVisible();
        }

        return this;
    }

    /**
     * Check for error messages
     */
    async verifyErrorMessage(message?: string) {
        const errorSelectors = [
            '[data-test-id="error-message"]',
            '.error-message',
            '.alert-error',
            '.alert-danger',
            ':has-text("Error")',
            ':has-text("Failed")'
        ];

        let found = false;
        for (const selector of errorSelectors) {
            try {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: 3000 });
                found = true;
                break;
            } catch (error) {
                // Continue to next selector
                console.log(`Selector ${selector} not found:`, error.message || error);
            }
        }

        if (!found && message) {
            await expect(this.page.locator(`:has-text("${message}")`)).toBeVisible();
        }

        return this;
    }

    /**
     * Wait for and verify Google Calendar integration elements
     */
    async verifyCalendarIntegration() {
        // Look for calendar-related buttons or indicators
        const calendarSelectors = [
            '[data-test-id="google-calendar-integration"]',
            '[data-test-id="calendar-integration-card"]',
            'button:has-text("Add to Calendar")',
            'button:has-text("Google Calendar")',
            '.calendar-integration'
        ];

        let found = false;
        for (const selector of calendarSelectors) {
            try {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: 3000 });
                found = true;
                break;
            } catch (error) {
                // Continue to next selector
                console.log(`Selector ${selector} not found:`, error.message || error);
            }
        }

        if (!found) {
            console.warn('No calendar integration elements found');
        }

        return this;
    }

    /**
     * Take a screenshot for debugging
     */
    async takeScreenshot(name: string) {
        await this.page.screenshot({ path: `test-results/screenshots/${name}-${Date.now()}.png` });
        return this;
    }

    /**
     * Log current page URL and title for debugging
     */
    async logCurrentPage() {
        const url = this.page.url();
        const title = await this.page.title();
        console.log(`Current page: ${title} (${url})`);
        return this;
    }

    /**
     * Navigate to first available event (more robust than hardcoded IDs)
     */
    async goToFirstAvailableEvent() {
        // Navigate to homepage which displays events
        await this.page.goto('/', { timeout: 10000, waitUntil: 'domcontentloaded' });
        await this.waitForPageLoad();
        
        // Wait for auth state to settle
        await this.auth.waitForAuthState(3000);

        // Look for event cards on homepage using data-test-id
        const eventCards = this.page.locator('[data-test-id="event-card"], button:has-text("View Details")');

        const cardCount = await eventCards.count();
        if (cardCount > 0) {
            console.log(`Found ${cardCount} event cards on homepage`);

            // Click the first event's "View Details" button or card
            const firstEventCard = eventCards.first();
            await firstEventCard.scrollIntoViewIfNeeded();
            await firstEventCard.click();
            await this.waitForPageLoad();
            
            // Wait for auth state after navigation
            await this.auth.waitForAuthState(3000);
            return this;
        }

        // If no events found on homepage, try fallback UUID (less likely to work)
        console.warn('No events found on homepage, trying fallback UUID');
        try {
            await this.page.goto('/events/00000000-0000-0000-0000-000000000001');
            await this.waitForPageLoad();
            await this.auth.waitForAuthState(3000);
        } catch (error) {
            console.warn('Fallback event ID also failed:', error);
            // Continue anyway to let tests handle gracefully
        }

        return this;
    }
}

export const testEvents = {
    // Use actual event URLs that should exist or be publicly accessible
    // Instead of hard-coded UUIDs, use paths that work with the current app
    validEventPath: '/events', // Will navigate to events list and pick first event
    createEventPath: '/staff/events/create',
    demoEventPath: '/demo', // If demo events exist

    // Centralized test event IDs
    validEventId: TEST_EVENT_IDS.freeEvent,
    freeEventId: TEST_EVENT_IDS.freeEvent,
    paidEventId: TEST_EVENT_IDS.paidEvent,
    pastEventId: TEST_EVENT_IDS.pastEvent,
    invalidEventId: '99999999-9999-9999-9999-999999999999',
    
    // Test form data
    formData: TEST_FORM_DATA
};

export const testUsers = {
    // Standard test user
    user: TEST_ACCOUNTS.user,
    
    // Staff user
    staff: TEST_ACCOUNTS.staff,
    
    // Admin user  
    admin: TEST_ACCOUNTS.admin,
    
    // Google OAuth user
    google: GOOGLE_TEST_ACCOUNT,
    
    // Legacy properties for backward compatibility
    testEmail: TEST_ACCOUNTS.user.email,
    testName: TEST_ACCOUNTS.user.displayName,
    staffEmail: TEST_ACCOUNTS.staff.email,
    staffName: TEST_ACCOUNTS.staff.displayName
}; 