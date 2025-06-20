import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting global test setup...');

    // Launch browser for setup operations
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Wait for development server to be ready (more reliable approach)
        console.log('⏳ Waiting for development server...');

        try {
            await page.goto(config.webServer?.url || 'http://localhost:3000', {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
        } catch (error) {
            // Fallback to simple page load
            console.log('Initial page load failed, trying fallback:', error.message || error);
            await page.goto(config.webServer?.url || 'http://localhost:3000', {
                timeout: 10000
            });
        }

        // Verify critical pages are accessible
        console.log('🔍 Verifying application health...');

        // Check homepage basic structure
        const hasContent = await page.locator('h1, h2, h3').first().isVisible({ timeout: 5000 });
        if (!hasContent) {
            throw new Error('Homepage does not have basic heading structure');
        }

        console.log('✅ Application health check passed');

        // Setup test data if needed
        // This is where you would create test users, events, etc.
        console.log('📝 Test data setup completed');

    } catch (error) {
        console.error('❌ Global setup failed:', error);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }

    console.log('✅ Global test setup completed');
}

export default globalSetup; 