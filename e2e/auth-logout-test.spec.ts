import { test, expect } from '@playwright/test';
import { createAuthHelpers } from './utils/auth-helpers';

test.describe('Authentication Logout Flow - Rock Solid', () => {
    test('should complete full login and logout cycle using data-testid selectors', async ({ page }) => {
        const auth = createAuthHelpers(page);
        
        console.log('=== Testing rock-solid logout flow ===');
        
        // Step 1: Login
        console.log('Step 1: Logging in...');
        await auth.loginAsUser();
        
        // Verify authentication state
        expect(await auth.isAuthenticated()).toBe(true);
        console.log('✅ Login successful and verified');
        
        // Step 2: Verify user name is displayed
        const userName = await auth.getCurrentUserName();
        expect(userName).toBeTruthy();
        console.log(`✅ User name displayed: "${userName}"`);
        
        // Step 3: Navigate to homepage to ensure profile dropdown is available
        await page.goto('/', { timeout: 15000, waitUntil: 'domcontentloaded' });
        try {
            await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            console.log('Network idle wait failed, falling back to domcontentloaded:', error.message || error);
            await page.waitForLoadState('domcontentloaded');
        }
        
        // Step 4: Verify profile dropdown button is visible
        const profileButton = page.locator('[data-testid="profile-dropdown-button"]');
        await expect(profileButton).toBeVisible({ timeout: 5000 });
        console.log('✅ Profile dropdown button is visible');
        
        // Step 5: Click profile button to open dropdown
        await profileButton.click();
        console.log('✅ Profile button clicked');
        
        // Step 6: Verify dropdown menu appears
        const dropdownMenu = page.locator('[data-testid="profile-dropdown-menu"]');
        await expect(dropdownMenu).toBeVisible({ timeout: 5000 });
        console.log('✅ Dropdown menu is visible');
        
        // Step 7: Verify sign out button is visible
        const signOutButton = page.locator('[data-testid="profile-sign-out-button"]');
        await expect(signOutButton).toBeVisible({ timeout: 5000 });
        console.log('✅ Sign out button is visible');
        
        // Take screenshot before logout for debugging
        await page.screenshot({ path: 'test-results/before-logout.png', fullPage: true });
        
        // Step 8: Perform logout
        console.log('Step 8: Performing logout...');
        await auth.logout();
        
        // Step 9: Verify logout was successful
        expect(await auth.isAuthenticated()).toBe(false);
        console.log('✅ Logout successful and verified');
        
        // Step 10: Verify sign in link is now visible (user is logged out)
        const signInLink = page.locator('[data-testid="sign-in-link"]');
        await expect(signInLink).toBeVisible({ timeout: 5000 });
        console.log('✅ Sign in link is visible - logout confirmed');
        
        // Take screenshot after logout for verification
        await page.screenshot({ path: 'test-results/after-logout.png', fullPage: true });
        
        console.log('=== Rock-solid logout flow test completed successfully ===');
    });
    
    test('should handle logout when profile dropdown is already open', async ({ page }) => {
        const auth = createAuthHelpers(page);
        
        console.log('=== Testing logout with pre-opened dropdown ===');
        
        // Login first
        await auth.loginAsUser();
        expect(await auth.isAuthenticated()).toBe(true);
        
        // Navigate to homepage
        await page.goto('/', { timeout: 15000, waitUntil: 'domcontentloaded' });
        try {
            await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            console.log('Network idle wait failed, falling back to domcontentloaded:', error.message || error);
            await page.waitForLoadState('domcontentloaded');
        }
        
        // Open dropdown
        const profileButton = page.locator('[data-testid="profile-dropdown-button"]');
        await profileButton.click();
        
        // Verify dropdown is open
        const dropdownMenu = page.locator('[data-testid="profile-dropdown-menu"]');
        await expect(dropdownMenu).toBeVisible();
        
        // Direct click on sign out button (without using auth.logout() wrapper)
        const signOutButton = page.locator('[data-testid="profile-sign-out-button"]');
        await signOutButton.click();
        
        // Wait for logout to complete
        try {
            await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            console.log('Network idle wait failed, falling back to domcontentloaded:', error.message || error);
            await page.waitForLoadState('domcontentloaded');
        }
        
        // Verify logout
        const signInLink = page.locator('[data-testid="sign-in-link"]');
        await expect(signInLink).toBeVisible({ timeout: 10000 });
        
        console.log('✅ Direct logout from open dropdown successful');
    });
    
    test('should logout successfully across different pages', async ({ page }) => {
        const auth = createAuthHelpers(page);
        
        console.log('=== Testing logout from different pages ===');
        
        // Login
        await auth.loginAsUser();
        expect(await auth.isAuthenticated()).toBe(true);
        
        // Test logout from My Events page
        await page.goto('/my-events', { timeout: 15000, waitUntil: 'domcontentloaded' });
        try {
            await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            console.log('Network idle wait failed, falling back to domcontentloaded:', error.message || error);
            await page.waitForLoadState('domcontentloaded');
        }
        
        // Verify we're still authenticated on this page
        expect(await auth.isAuthenticated()).toBe(true);
        
        // Perform logout from this page
        await auth.logout();
        
        // Verify logout
        expect(await auth.isAuthenticated()).toBe(false);
        
        console.log('✅ Logout from /my-events page successful');
    });
});