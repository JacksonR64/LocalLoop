import { test, expect } from '@playwright/test';
import { createAuthHelpers } from './utils/auth-helpers';

test.describe('Debug Authenticated State', () => {
    test('examine authenticated page elements', async ({ page }) => {
        const auth = createAuthHelpers(page);
        
        console.log('=== Examining authenticated state ===');
        
        // First login
        await page.goto('/auth/login');
        await page.locator('input[type="email"]').fill('test1@localloopevents.xyz');
        await page.locator('input[type="password"]').fill('zunTom-9wizri-refdes');
        await page.locator('button[type="submit"]:has-text("Sign in")').click();
        
        // Wait for redirect
        await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        console.log(`Current URL: ${page.url()}`);
        
        // Check authentication status
        const isAuth = await auth.isAuthenticated();
        console.log(`Is authenticated: ${isAuth}`);
        
        // Take screenshot
        await page.screenshot({ path: 'test-results/debug-authenticated-state.png', fullPage: true });
        
        // Get all buttons on the page
        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on the page:`);
        
        for (let i = 0; i < Math.min(buttons.length, 20); i++) {
            try {
                const button = buttons[i];
                const text = await button.textContent();
                const classNames = await button.getAttribute('class');
                const isVisible = await button.isVisible();
                console.log(`Button ${i}: "${text}" | Class: "${classNames}" | Visible: ${isVisible}`);
            } catch (e) {
                console.log(`Button ${i}: Could not read properties`);
            }
        }
        
        // Get all links
        const links = await page.locator('a').all();
        console.log(`\nFound ${links.length} links:`);
        
        for (let i = 0; i < Math.min(links.length, 15); i++) {
            try {
                const link = links[i];
                const text = await link.textContent();
                const href = await link.getAttribute('href');
                const isVisible = await link.isVisible();
                if (text && text.trim()) {
                    console.log(`Link ${i}: "${text.trim()}" -> ${href} | Visible: ${isVisible}`);
                }
            } catch (e) {
                console.log(`Link ${i}: Could not read properties`);
            }
        }
        
        // Look for specific elements that should indicate authentication
        const authElements = [
            '[data-test-id="sign-in-link"]',
            'a[href="/my-events"]',
            'button:has(.lucide-user)',
            'button:has(span)',
            '[data-test-id="user-role-badge"]',
            '.profile-dropdown',
            'button:has-text("Sign Out")',
            'button:has-text("User")'
        ];
        
        console.log('\n=== Checking specific auth elements ===');
        for (const selector of authElements) {
            try {
                const element = page.locator(selector);
                const isVisible = await element.isVisible({ timeout: 1000 });
                const count = await element.count();
                if (isVisible && count > 0) {
                    const text = await element.first().textContent();
                    console.log(`✅ Found: ${selector} - "${text}" (${count} elements)`);
                } else {
                    console.log(`❌ Not found: ${selector}`);
                }
            } catch (e) {
                console.log(`❌ Error checking: ${selector} - ${(e as Error).message}`);
            }
        }
        
        // Check page structure
        const navigation = page.locator('nav, header');
        const navCount = await navigation.count();
        console.log(`\nFound ${navCount} navigation elements`);
        
        if (navCount > 0) {
            const navContent = await navigation.first().innerHTML();
            console.log(`Navigation HTML (first 500 chars): ${navContent.substring(0, 500)}...`);
        }
        
        console.log('=== Debug completed ===');
    });
});