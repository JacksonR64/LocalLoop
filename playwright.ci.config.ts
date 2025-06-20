import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration optimized for CI/CD pipeline
 * 
 * This configuration is designed for speed and reliability in CI environments:
 * - Only runs essential smoke tests that don't require database connectivity
 * - Uses Desktop Chrome and Mobile Safari for cross-platform coverage
 * - Optimized timeouts and worker settings
 * - Focuses on build verification and basic static functionality
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    /* Test file filtering - only run basic tests without database dependencies */
    testMatch: [
        '**/example.spec.ts',      // Basic smoke tests only
        // Exclude RSVP and ticket flows that require database connectivity
    ],

    /* Run tests in files in parallel */
    fullyParallel: false, // Disabled for stability

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0, // Increased retries

    /* Single worker for maximum stability */
    workers: 1,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? [['github'], ['html']] : 'html',

    /* Global timeout for each test */
    timeout: 45000, // 45 seconds per test

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Balanced timeouts for CI stability */
        actionTimeout: 20000,      // 20s for actions
        navigationTimeout: 45000,  // 45s for navigation
    },

    /* Optimized browser coverage for CI - Big 3 browsers + Mobile Safari */
    projects: [
        {
            name: 'CI Chromium',
            use: {
                ...devices['Desktop Chrome'],
                actionTimeout: 20000,  // Balanced for CI
                navigationTimeout: 45000,  // Balanced for CI
            },
            testMatch: ['**/example.spec.ts'],
            testIgnore: ['**/*rsvp*', '**/*ticket*', '**/*auth*', '**/*payment*'],
        },
        {
            name: 'CI WebKit',
            use: {
                ...devices['Desktop Safari'],
                actionTimeout: 20000,  // Balanced for CI
                navigationTimeout: 45000,  // Balanced for CI
            },
            testMatch: ['**/example.spec.ts'],
            testIgnore: ['**/*rsvp*', '**/*ticket*', '**/*auth*', '**/*payment*'],
        },
        {
            name: 'CI Firefox',
            use: {
                ...devices['Desktop Firefox'],
                actionTimeout: 20000,  // Balanced for CI
                navigationTimeout: 45000,  // Balanced for CI
            },
            testMatch: ['**/example.spec.ts'],
            testIgnore: ['**/*rsvp*', '**/*ticket*', '**/*auth*', '**/*payment*'],
        },
        {
            name: 'CI Mobile Safari',
            use: {
                ...devices['iPhone 12'],
                actionTimeout: 20000,  // Balanced for CI
                navigationTimeout: 45000,  // Balanced for CI
            },
            testMatch: ['**/example.spec.ts'],
            testIgnore: ['**/*rsvp*', '**/*ticket*', '**/*auth*', '**/*payment*'],
        },
    ],

    /* Run development server for CI tests - more reliable startup */
    webServer: {
        command: 'npm run dev',  // Use dev server for faster startup and reliability
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 90000, // 90 seconds for dev server startup
        stdout: 'pipe',
        stderr: 'pipe',
    },
}); 