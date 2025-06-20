import { test, expect } from '@playwright/test';
import { createAuthHelpers } from './utils/auth-helpers';

test.describe('Debug Authentication', () => {
    test('debug login flow and page elements', async ({ page }) => {
        const auth = createAuthHelpers(page);
        
        console.log('=== Starting debug test ===');
        
        // Check initial state
        await page.goto('/');
        console.log('Homepage loaded');
        
        // Check for Sign In link presence
        const signInLink = page.locator('[data-test-id="sign-in-link"]');
        const hasSignInLink = await signInLink.isVisible({ timeout: 2000 });
        console.log(`Sign In link visible: ${hasSignInLink}`);
        
        if (hasSignInLink) {
            const signInText = await signInLink.textContent();
            console.log(`Sign In link text: "${signInText}"`);
        }
        
        // Navigate to login page
        console.log('Navigating to login page...');
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check form elements
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"]:has-text("Sign in")');
        
        console.log(`Email input visible: ${await emailInput.isVisible()}`);
        console.log(`Password input visible: ${await passwordInput.isVisible()}`);
        console.log(`Submit button visible: ${await submitButton.isVisible()}`);
        
        if (await submitButton.isVisible()) {
            const buttonText = await submitButton.textContent();
            console.log(`Submit button text: "${buttonText}"`);
        }
        
        // Try login
        console.log('Attempting login...');
        await emailInput.fill('test1@localloopevents.xyz');
        await passwordInput.fill('zunTom-9wizri-refdes');
        
        // Take screenshot before submit
        await page.screenshot({ path: 'test-results/debug-before-login.png' });
        
        await submitButton.click();
        
        // Wait a bit for any redirect or loading
        await page.waitForTimeout(3000);
        
        console.log(`Current URL after login: ${page.url()}`);
        
        // Take screenshot after submit
        await page.screenshot({ path: 'test-results/debug-after-login.png' });
        
        // Check for error messages
        const errorSelectors = [
            '.error-message',
            '.alert-error',
            'div[class*="error"]',
            'div[class*="red"]',
            ':has-text("error")',
            ':has-text("Error")',
            ':has-text("failed")',
            ':has-text("Failed")',
            ':has-text("incorrect")',
            ':has-text("invalid")'
        ];
        
        for (const selector of errorSelectors) {
            try {
                const errorElement = page.locator(selector);
                if (await errorElement.isVisible({ timeout: 1000 })) {
                    const errorText = await errorElement.textContent();
                    console.log(`Found error with selector "${selector}": "${errorText}"`);
                }
            } catch {
                // Continue to next selector
            }
        }
        
        // Check current authentication state
        const isAuth = await auth.isAuthenticated();
        console.log(`Authentication detected: ${isAuth}`);
        
        // Check specific elements
        const signInLinkAfter = page.locator('[data-test-id="sign-in-link"]');
        const hasSignInLinkAfter = await signInLinkAfter.isVisible({ timeout: 2000 });
        console.log(`Sign In link visible after login: ${hasSignInLinkAfter}`);
        
        // Check for profile/user elements
        const userElements = [
            'button:has-text("User")',
            '[data-test-id="user-role-badge"]',
            'button:has(span):has-text(/[A-Za-z]/)',
            '.profile-dropdown',
            '.user-menu'
        ];
        
        for (const selector of userElements) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible({ timeout: 1000 })) {
                    const text = await element.textContent();
                    console.log(`Found user element with selector "${selector}": "${text}"`);
                }
            } catch {
                // Continue to next selector
            }
        }
        
        console.log('=== Debug test completed ===');
    });
});