import { Page, expect } from '@playwright/test';

/**
 * Browser Testing Utilities
 * Helper functions for cross-browser and responsive testing
 */

export interface ViewportSize {
    width: number;
    height: number;
    name: string;
}

export interface DeviceMetrics {
    viewport: ViewportSize;
    userAgent: string;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
}

// Common viewport sizes for testing
export const VIEWPORTS = {
    mobile: { width: 375, height: 667, name: 'Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: 1440, height: 900, name: 'Desktop' },
    widescreen: { width: 1920, height: 1080, name: 'Widescreen' },
    smallMobile: { width: 320, height: 568, name: 'Small Mobile' },
    largeMobile: { width: 414, height: 896, name: 'Large Mobile' }
} as const;

// Browser-specific configurations
export const BROWSER_CONFIGS = {
    chromium: {
        name: 'Chromium',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    firefox: {
        name: 'Firefox',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
    },
    webkit: {
        name: 'WebKit',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
    }
} as const;

/**
 * Set viewport size for responsive testing
 */
export async function setViewport(page: Page, viewport: ViewportSize): Promise<void> {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
}

/**
 * Test responsive behavior across multiple viewports
 */
export async function testAcrossViewports(
    page: Page,
    testFunction: (viewport: ViewportSize) => Promise<void>,
    viewports: ViewportSize[] = Object.values(VIEWPORTS)
): Promise<void> {
    for (const viewport of viewports) {
        await setViewport(page, viewport);
        await testFunction(viewport);
    }
}

/**
 * Check if element is visible and properly positioned
 */
export async function checkElementVisibility(
    page: Page,
    selector: string,
    viewport: ViewportSize
): Promise<boolean> {
    const element = page.locator(selector);
    await expect(element).toBeVisible();

    const boundingBox = await element.boundingBox();
    if (!boundingBox) return false;

    // Check if element is within viewport bounds
    return (
        boundingBox.x >= 0 &&
        boundingBox.y >= 0 &&
        boundingBox.x + boundingBox.width <= viewport.width &&
        boundingBox.y + boundingBox.height <= viewport.height
    );
}

/**
 * Test touch interactions (for mobile devices)
 */
export async function testTouchInteraction(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    await element.tap();
    // Add small delay for touch interaction processing
    await page.waitForTimeout(100);
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page): Promise<void> {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Test enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Test escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
}

/**
 * Check responsive image loading
 */
export async function checkResponsiveImages(page: Page): Promise<void> {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        await expect(img).toBeVisible();

        // Check if image has loaded
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
    }
}

/**
 * Test form responsiveness
 */
export async function testFormResponsiveness(
    page: Page,
    formSelector: string,
    viewport: ViewportSize
): Promise<void> {
    const form = page.locator(formSelector);
    await expect(form).toBeVisible();

    // Check form inputs are properly sized
    const inputs = form.locator('input, textarea, select');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const boundingBox = await input.boundingBox();

        if (boundingBox) {
            // Ensure inputs aren't too wide for viewport
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width * 0.9);
        }
    }
}

/**
 * Check navigation responsiveness
 */
export async function testNavigationResponsiveness(page: Page, viewport: ViewportSize): Promise<void> {
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    if (viewport.width < 768) {
        // On mobile, check for hamburger menu or mobile navigation
        const mobileMenu = page.locator('[aria-label*="menu"], [aria-label*="navigation"], .mobile-menu, .hamburger');
        const mobileMenuExists = await mobileMenu.count() > 0;

        if (mobileMenuExists) {
            await expect(mobileMenu).toBeVisible();
        }
    }
}

/**
 * Test scroll behavior across devices
 */
export async function testScrollBehavior(page: Page, viewport: ViewportSize): Promise<void> {
    // Test smooth scrolling
    console.log(`Testing scroll behavior for viewport: ${viewport.width}x${viewport.height}`);
    await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    await page.waitForTimeout(500);

    // Test scroll to top
    await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(500);
}

/**
 * Check page performance across browsers
 */
export async function checkPagePerformance(page: Page): Promise<{
    loadTime: number;
    domElements: number;
    imageCount: number;
}> {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    const domElements = await page.evaluate(() => document.querySelectorAll('*').length);
    const imageCount = await page.locator('img').count();

    return { loadTime, domElements, imageCount };
}

/**
 * Test accessibility across browsers
 */
export async function testBasicAccessibility(page: Page): Promise<void> {
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined();
    }

    // Check for proper heading hierarchy
    const h1s = await page.locator('h1').count();
    expect(h1s).toBeGreaterThanOrEqual(1);
    expect(h1s).toBeLessThanOrEqual(1); // Should only have one h1
}

/**
 * Cross-browser storage testing
 */
export async function testBrowserStorage(page: Page): Promise<void> {
    // Test localStorage
    await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
    });

    const stored = await page.evaluate(() => localStorage.getItem('test-key'));
    expect(stored).toBe('test-value');

    // Clean up
    await page.evaluate(() => {
        localStorage.removeItem('test-key');
    });
}

/**
 * Test CSS features across browsers
 */
export async function testCSSFeatures(page: Page): Promise<void> {
    // Test CSS Grid support
    const gridSupport = await page.evaluate(() => {
        const div = document.createElement('div');
        div.style.display = 'grid';
        return getComputedStyle(div).display === 'grid';
    });
    expect(gridSupport).toBe(true);

    // Test CSS Flexbox support
    const flexSupport = await page.evaluate(() => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        return getComputedStyle(div).display === 'flex';
    });
    expect(flexSupport).toBe(true);
}

/**
 * Utility to wait for animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
    await page.waitForFunction(() => {
        const animations = document.getAnimations();
        return animations.every(animation => animation.playState === 'finished');
    });
}

/**
 * Generate a comprehensive browser test report
 */
export async function generateBrowserTestReport(
    page: Page,
    browserName: string,
    viewport: ViewportSize
): Promise<{
    browser: string;
    viewport: ViewportSize;
    performance: Awaited<ReturnType<typeof checkPagePerformance>>;
    timestamp: string;
}> {
    const performance = await checkPagePerformance(page);

    return {
        browser: browserName,
        viewport,
        performance,
        timestamp: new Date().toISOString()
    };
} 