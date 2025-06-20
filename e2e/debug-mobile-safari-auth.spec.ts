import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Debug Mobile Safari Authentication', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page, context }) => {
        // Clear all state
        await context.clearCookies();
        await context.clearPermissions();
        
        // Navigate to homepage first
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        
        // Clear browser storage
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        
        helpers = new TestHelpers(page);
        await helpers.auth.cleanupAuth();
    });

    test('debug Mobile Safari login form submission', async ({ page }) => {
        console.log('🔍 Starting Mobile Safari auth debug...');
        
        // Navigate to login page
        console.log('Step 1: Navigate to login page');
        await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Wait for form to be visible
        console.log('Step 2: Wait for login form');
        await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
        
        // Fill email with explicit data-testid
        console.log('Step 3: Fill email field');
        const emailInput = page.locator('[data-testid="email-input"]');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        await emailInput.fill('test1@localloopevents.xyz');
        console.log('✅ Email filled');
        
        // Fill password with explicit data-testid
        console.log('Step 4: Fill password field');
        const passwordInput = page.locator('[data-testid="password-input"]');
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
        await passwordInput.fill('zunTom-9wizri-refdes');
        console.log('✅ Password filled');
        
        // Take screenshot before submission
        await page.screenshot({ path: 'test-results/mobile-safari-before-submit.png' });
        
        // Try multiple submission methods
        console.log('Step 5: Attempt form submission');
        const submitButton = page.locator('[data-testid="login-submit-button"]');
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        
        // Method 1: Direct button click
        console.log('Trying method 1: Button click');
        try {
            await submitButton.click({ timeout: 5000 });
            console.log('✅ Button click succeeded');
        } catch (error) {
            console.log('❌ Button click failed:', error);
        }
        
        // Wait a moment to see if anything happens
        await page.waitForTimeout(3000);
        
        // Check if we're still on login page
        const currentUrl = page.url();
        console.log('Current URL after button click:', currentUrl);
        
        if (currentUrl.includes('/auth/login')) {
            console.log('Still on login page, trying method 2: Form submit');
            try {
                await page.locator('form').evaluate(form => form.submit());
                console.log('✅ Form submit succeeded');
            } catch (error) {
                console.log('❌ Form submit failed:', error);
            }
            
            await page.waitForTimeout(3000);
            
            if (page.url().includes('/auth/login')) {
                console.log('Still on login page, trying method 3: Enter key');
                try {
                    await passwordInput.press('Enter');
                    console.log('✅ Enter key succeeded');
                } catch (error) {
                    console.log('❌ Enter key failed:', error);
                }
            }
        }
        
        // Wait for potential redirect and auth state to settle
        await page.waitForTimeout(8000);
        
        // Check cookies and storage
        console.log('Step 6: Checking browser state');
        const cookies = await page.context().cookies();
        const authCookies = cookies.filter(c => c.name.includes('supabase') || c.name.includes('auth'));
        console.log('Auth-related cookies:', authCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
        
        const localStorage = await page.evaluate(() => Object.keys(window.localStorage));
        console.log('LocalStorage keys:', localStorage);
        
        const sessionStorage = await page.evaluate(() => Object.keys(window.sessionStorage));
        console.log('SessionStorage keys:', sessionStorage);
        
        // Take screenshot after submission attempts
        await page.screenshot({ path: 'test-results/mobile-safari-after-submit.png' });
        
        // Check final state
        const finalUrl = page.url();
        console.log('Final URL:', finalUrl);
        
        // Check for any visible error messages
        const errorMessages = await page.locator('.error-message, .alert-danger, [role="alert"]').allTextContents();
        if (errorMessages.length > 0) {
            console.log('Error messages found:', errorMessages);
        }
        
        // Take screenshot to see final state
        await page.screenshot({ path: 'test-results/mobile-safari-final-state.png', fullPage: true });
        
        // Debug: Check what elements are actually visible
        const allDataTestIds = await page.locator('[data-testid], [data-test-id]').allTextContents();
        console.log('All elements with data-test-id:', allDataTestIds);
        
        // Check specific selectors
        const mobileProfileDropdown = page.locator('[data-testid="mobile-profile-dropdown-button"]');
        const desktopProfileDropdown = page.locator('[data-testid="desktop-profile-dropdown-button"]');
        const signInLink = page.locator('[data-testid="mobile-sign-in-link"]');
        
        console.log('Mobile profile dropdown visible:', await mobileProfileDropdown.isVisible({ timeout: 1000 }));
        console.log('Desktop profile dropdown visible:', await desktopProfileDropdown.isVisible({ timeout: 1000 }));
        console.log('Mobile sign in link visible:', await signInLink.isVisible({ timeout: 1000 }));
        
        // Check if we're authenticated
        const isAuth = await helpers.auth.isAuthenticated();
        console.log('Authentication status:', isAuth ? '✅ Authenticated' : '❌ Not authenticated');
        
        console.log('🏁 Debug test completed');
    });
});