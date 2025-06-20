import { test } from '@playwright/test';

test.describe('Detailed Login Debug', () => {
    test('capture network requests and errors during login', async ({ page }) => {
        // Capture console messages
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        });

        // Capture network responses
        const networkResponses: any[] = [];
        page.on('response', response => {
            networkResponses.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        });

        // Navigate to login page
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        console.log('=== Starting detailed login debug ===');

        // Check for any existing error messages
        const errorElements = await page.locator('div[class*="red"], div[class*="error"], .error, [role="alert"]').all();
        console.log(`Found ${errorElements.length} potential error elements initially`);

        for (let i = 0; i < errorElements.length; i++) {
            try {
                const text = await errorElements[i].textContent();
                if (text && text.trim()) {
                    console.log(`Initial error ${i}: "${text}"`);
                }
            } catch (error) {
                // Element might not be visible
                console.log(`Error reading initial error element ${i}:`, error.message || error);
            }
        }

        // Fill in the form
        await page.locator('input[type="email"]').fill('test1@localloopevents.xyz');
        await page.locator('input[type="password"]').fill('zunTom-9wizri-refdes');

        console.log('Form filled, submitting...');

        // Submit and monitor responses
        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/') && response.request().method() === 'POST'
        );

        await page.locator('button[type="submit"]:has-text("Sign in")').click();

        try {
            const response = await responsePromise;
            console.log(`Login API response: ${response.status()} ${response.statusText()}`);
            console.log(`Response URL: ${response.url()}`);
            
            // Try to get response body if possible
            try {
                const responseBody = await response.text();
                console.log(`Response body: ${responseBody.substring(0, 500)}...`);
            } catch (error) {
                console.log('Could not read response body:', error.message || error);
            }
        } catch (error) {
            console.log('No API response captured or timeout:', error.message || error);
        }

        // Wait a bit for any async operations
        await page.waitForTimeout(3000);

        console.log(`Final URL: ${page.url()}`);

        // Check for error messages after submission
        const postSubmitErrors = await page.locator('div[class*="red"], div[class*="error"], .error, [role="alert"]').all();
        console.log(`Found ${postSubmitErrors.length} potential error elements after submission`);

        for (let i = 0; i < postSubmitErrors.length; i++) {
            try {
                const text = await postSubmitErrors[i].textContent();
                if (text && text.trim()) {
                    console.log(`Post-submit error ${i}: "${text}"`);
                }
            } catch (error) {
                // Element might not be visible
                console.log(`Error reading post-submit error element ${i}:`, error.message || error);
            }
        }

        // Look for loading states
        const loadingElements = await page.locator('button:has-text("Signing in"), button:has-text("Loading"), [aria-busy="true"]').all();
        console.log(`Found ${loadingElements.length} loading indicators`);

        // Check current page title and body text for clues
        const title = await page.title();
        console.log(`Page title: ${title}`);

        // Log any console messages from the browser
        console.log('\n=== Console Messages ===');
        consoleMessages.forEach((msg, i) => {
            console.log(`${i + 1}. ${msg}`);
        });

        // Log relevant network responses
        console.log('\n=== Network Responses ===');
        networkResponses
            .filter(resp => resp.url.includes('/api/') || resp.url.includes('/auth/'))
            .forEach((resp, i) => {
                console.log(`${i + 1}. ${resp.status} ${resp.url}`);
            });

        console.log('=== Detailed debug completed ===');
    });
});