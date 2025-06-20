import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ?
        [['list'], ['html']] :
        [['list'], ['html', { open: 'never' }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Video recording for failed tests */
        video: 'retain-on-failure',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Enhanced for visual testing */
        ignoreHTTPSErrors: true,
        actionTimeout: 15000,
        navigationTimeout: 30000,
    },

    /* Configure projects for major browsers */
    projects: process.env.CI ? [
        // CI mode: comprehensive testing
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'Desktop Safari',
            use: { ...devices['Desktop Safari'] },
        },

        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ] : [
        // Local development: streamlined testing - only Desktop Chrome and Mobile Safari
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],

    /* Global setup and teardown (temporarily disabled) */
    // globalSetup: require.resolve('./e2e/global-setup.ts'),
    // globalTeardown: require.resolve('./e2e/global-teardown.ts'),

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true, // Always reuse existing server (CI workflow starts it manually)
        timeout: 60 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },

    /* Test timeout */
    timeout: 30 * 1000, // 30 seconds per test

    /* Expect timeout */
    expect: {
        timeout: 5 * 1000, // 5 seconds for assertions
        // Enable visual comparisons
        toHaveScreenshot: { threshold: 0.2 },
        toMatchSnapshot: { threshold: 0.2 },
    },
}); 