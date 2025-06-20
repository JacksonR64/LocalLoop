import { test, expect, devices } from '@playwright/test';

// Configure device at the top level to avoid worker issues
test.use({ ...devices['iPhone 14'] });

const VIEWPORTS = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 }
};

async function testTouchInteraction(page: any, selector: string) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
        const box = await element.first().boundingBox();
        if (box) {
            // Test touch target size (should be at least 44px)
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
        }
    }
}

async function testNavigationResponsiveness(page: any, viewport: any) {
    await page.setViewportSize(viewport);

    // Test navigation elements using data-test-id
    const header = page.locator('[data-test-id="homepage-header"]');
    if (await header.count() > 0) {
        await expect(header.first()).toBeVisible();
    }
}

async function testFormResponsiveness(page: any, formSelector: string, viewport: any) {
    await page.setViewportSize(viewport);
    const form = page.locator(formSelector);
    if (await form.count() > 0) {
        await expect(form).toBeVisible();

        // Check form doesn't overflow viewport
        const formBox = await form.boundingBox();
        if (formBox) {
            expect(formBox.width).toBeLessThanOrEqual(viewport.width);
        }
    }
}

async function checkResponsiveImages(page: any) {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
            const box = await img.boundingBox();
            if (box) {
                expect(box.width).toBeGreaterThan(0);
                expect(box.height).toBeGreaterThan(0);
            }
        }
    }
}

async function testScrollBehavior(page: any, viewport: any) {
    await page.setViewportSize(viewport);

    // Test scroll behavior
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
}

/**
 * Mobile Testing Suite
 * Tests LocalLoop functionality across mobile devices and touch interactions
 * Updated to use data-test-id approach for consistency and reliability
 */

test.describe('Mobile Device Testing', () => {

    test.describe('iPhone Testing', () => {
        // Device configuration handled in playwright.config.ts

        test('should display homepage correctly on iPhone', async ({ page }) => {
            await page.goto('/');

            // Check core elements are visible using data-test-id
            await expect(page.locator('[data-test-id="homepage-title"]')).toContainText('LocalLoop');
            await expect(page.locator('[data-test-id="upcoming-events-title"]')).toContainText('Upcoming Events');

            // Test navigation responsiveness
            await testNavigationResponsiveness(page, VIEWPORTS.mobile);

            // Check images load properly
            await checkResponsiveImages(page);

            // Test scroll behavior
            await testScrollBehavior(page, VIEWPORTS.mobile);
        });

        test('should handle touch interactions on iPhone', async ({ page }) => {
            await page.goto('/');

            // Test touch interactions on event cards using data-test-id
            const featuredEventCards = page.locator('[data-test-id="featured-events-grid"] [data-test-id^="featured-event-"]');
            const upcomingEventCards = page.locator('[data-test-id="upcoming-events-grid"] [data-test-id^="upcoming-event-"]');

            let eventCardClicked = false;

            // Try featured events first
            if (await featuredEventCards.count() > 0) {
                const firstCard = featuredEventCards.first();
                await testTouchInteraction(page, '[data-test-id^="featured-event-"]');
                await firstCard.click();
                eventCardClicked = true;
            } else if (await upcomingEventCards.count() > 0) {
                const firstCard = upcomingEventCards.first();
                await testTouchInteraction(page, '[data-test-id^="upcoming-event-"]');
                await firstCard.click();
                eventCardClicked = true;
            }

            if (eventCardClicked) {
                // Verify navigation worked - should be on event detail page
                await page.waitForLoadState('domcontentloaded');
                const currentUrl = page.url();
                expect(currentUrl).toMatch(/\/events\/.+/);

                // Check event detail page loaded correctly
                await expect(page.locator('[data-test-id="event-detail-page"]')).toBeVisible();
            } else {
                console.log('No event cards available for touch testing');
            }
        });

        test('should handle forms correctly on iPhone', async ({ page }) => {
            await page.goto('/auth/login');

            // Test form responsiveness using generic form selector
            await testFormResponsiveness(page, 'form', VIEWPORTS.mobile);

            // Test touch interactions on form elements
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');
            const submitButton = page.locator('button[type="submit"]');

            if (await emailInput.isVisible()) {
                await testTouchInteraction(page, 'input[type="email"]');
            }

            if (await passwordInput.isVisible()) {
                await testTouchInteraction(page, 'input[type="password"]');
            }

            // Check submit button is accessible
            if (await submitButton.isVisible()) {
                await expect(submitButton).toBeVisible();
                await testTouchInteraction(page, 'button[type="submit"]');
            }
        });
    });

    test.describe('iPad Testing', () => {
        // Device configuration handled in playwright.config.ts

        test('should display homepage correctly on iPad', async ({ page }) => {
            await page.goto('/');

            // Check layout adjusts for tablet using data-test-id
            await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
            await expect(page.locator('[data-test-id="upcoming-events-title"]')).toContainText('Upcoming Events');

            // Test navigation for tablet view
            await testNavigationResponsiveness(page, VIEWPORTS.tablet);

            // Check event grid layout - at least upcoming events should be visible
            const featuredEventsGrid = page.locator('[data-test-id="featured-events-grid"]');
            const upcomingEventsGrid = page.locator('[data-test-id="upcoming-events-grid"]');

            // At least upcoming events grid should be visible
            await expect(upcomingEventsGrid).toBeVisible();

            // Featured events grid is conditional
            if (await featuredEventsGrid.count() > 0) {
                await expect(featuredEventsGrid).toBeVisible();
            }
        });

        test('should handle tablet-specific interactions', async ({ page }) => {
            await page.goto('/');

            // Test that hover states work appropriately on tablet
            const featuredEventCards = page.locator('[data-test-id="featured-events-grid"] [data-test-id^="featured-event-"]');
            const upcomingEventCards = page.locator('[data-test-id="upcoming-events-grid"] [data-test-id^="upcoming-event-"]');

            if (await featuredEventCards.count() > 0) {
                await featuredEventCards.first().hover();
                await testTouchInteraction(page, '[data-test-id^="featured-event-"]');
            } else if (await upcomingEventCards.count() > 0) {
                await upcomingEventCards.first().hover();
                await testTouchInteraction(page, '[data-test-id^="upcoming-event-"]');
            } else {
                // If no event cards available, just verify page structure
                await expect(page.locator('[data-test-id="upcoming-events-section"]')).toBeVisible();
            }
        });
    });

    test.describe('Android Testing', () => {
        // Device configuration handled in playwright.config.ts

        test('should display homepage correctly on Android', async ({ page }) => {
            await page.goto('/');

            // Check core functionality using data-test-id
            await expect(page.locator('[data-test-id="homepage-title"]')).toContainText('LocalLoop');
            await expect(page.locator('[data-test-id="upcoming-events-title"]')).toContainText('Upcoming Events');

            // Test Android-specific navigation
            await testNavigationResponsiveness(page, VIEWPORTS.mobile);

            // Test scroll behavior on Android
            await testScrollBehavior(page, VIEWPORTS.mobile);
        });

        test('should handle Android touch gestures', async ({ page }) => {
            await page.goto('/');

            // Test pull-to-refresh behavior (if implemented)
            await page.touchscreen.tap(200, 100);
            await page.mouse.move(200, 100);
            await page.mouse.down();
            await page.mouse.move(200, 300);
            await page.mouse.up();

            // Test swipe gestures on event cards
            const featuredEventCards = page.locator('[data-test-id="featured-events-grid"] [data-test-id^="featured-event-"]');
            const upcomingEventCards = page.locator('[data-test-id="upcoming-events-grid"] [data-test-id^="upcoming-event-"]');

            if (await featuredEventCards.count() > 0) {
                const firstCard = featuredEventCards.first();
                const boundingBox = await firstCard.boundingBox();

                if (boundingBox) {
                    // Simulate horizontal swipe
                    await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
                    await page.mouse.down();
                    await page.mouse.move(boundingBox.x + 150, boundingBox.y + 50);
                    await page.mouse.up();
                }
            } else if (await upcomingEventCards.count() > 0) {
                const firstCard = upcomingEventCards.first();
                const boundingBox = await firstCard.boundingBox();

                if (boundingBox) {
                    // Simulate horizontal swipe
                    await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
                    await page.mouse.down();
                    await page.mouse.move(boundingBox.x + 150, boundingBox.y + 50);
                    await page.mouse.up();
                }
            }

            // Verify page still functions after gestures
            await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
        });
    });

    test.describe('Cross-Device Form Testing', () => {

        test('should handle RSVP forms across mobile devices', async ({ page }) => {
            await page.goto('/');

            // Navigate to an event detail page first
            const featuredEventCards = page.locator('[data-test-id="featured-events-grid"] [data-test-id^="featured-event-"]');
            const upcomingEventCards = page.locator('[data-test-id="upcoming-events-grid"] [data-test-id^="upcoming-event-"]');

            let navigatedToEvent = false;

            if (await featuredEventCards.count() > 0) {
                await featuredEventCards.first().click();
                navigatedToEvent = true;
            } else if (await upcomingEventCards.count() > 0) {
                await upcomingEventCards.first().click();
                navigatedToEvent = true;
            }

            if (navigatedToEvent) {
                await page.waitForLoadState('domcontentloaded');

                // Look for RSVP section using data-test-id
                const rsvpSection = page.locator('[data-test-id="rsvp-section"]');

                if (await rsvpSection.isVisible()) {
                    // Test RSVP form elements
                    const rsvpForm = page.locator('[data-test-id="rsvp-form"]');
                    if (await rsvpForm.isVisible()) {
                        await testFormResponsiveness(page, '[data-test-id="rsvp-form"]', VIEWPORTS.mobile);

                        // Test input fields if they exist
                        const guestNameInput = page.locator('[data-test-id="guest-name-input"]');
                        const guestEmailInput = page.locator('[data-test-id="guest-email-input"]');

                        if (await guestNameInput.isVisible()) {
                            await testTouchInteraction(page, '[data-test-id="guest-name-input"]');
                        }

                        if (await guestEmailInput.isVisible()) {
                            await testTouchInteraction(page, '[data-test-id="guest-email-input"]');
                        }
                    }
                }
            } else {
                console.log('No events available to test RSVP forms');
            }
        });

        test('should handle ticket purchase forms on mobile', async ({ page }) => {
            await page.goto('/');

            // Navigate to an event with tickets
            const featuredEventCards = page.locator('[data-test-id="featured-events-grid"] [data-test-id^="featured-event-"]');
            const upcomingEventCards = page.locator('[data-test-id="upcoming-events-grid"] [data-test-id^="upcoming-event-"]');

            let navigatedToEvent = false;

            if (await featuredEventCards.count() > 0) {
                await featuredEventCards.first().click();
                navigatedToEvent = true;
            } else if (await upcomingEventCards.count() > 0) {
                await upcomingEventCards.first().click();
                navigatedToEvent = true;
            }

            if (navigatedToEvent) {
                await page.waitForLoadState('domcontentloaded');

                // Look for ticket section using data-test-id
                const ticketSection = page.locator('[data-test-id="ticket-section"]');

                if (await ticketSection.isVisible()) {
                    // Test ticket selection elements
                    const quantityInput = page.locator('[data-test-id="quantity-input"]');
                    const increaseButton = page.locator('[data-test-id="increase-quantity-button"]');
                    const decreaseButton = page.locator('[data-test-id="decrease-quantity-button"]');

                    if (await quantityInput.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="quantity-input"]');
                    }

                    if (await increaseButton.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="increase-quantity-button"]');
                    }

                    if (await decreaseButton.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="decrease-quantity-button"]');
                    }
                }
            } else {
                console.log('No events available to test ticket purchase forms');
            }
        });
    });

    test.describe('Mobile Navigation Testing', () => {

        test('should handle mobile menu correctly', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile);
            await page.goto('/');

            // Test mobile menu button
            const mobileMenuButton = page.locator('[data-test-id="mobile-menu-button"]');

            if (await mobileMenuButton.isVisible()) {
                await testTouchInteraction(page, '[data-test-id="mobile-menu-button"]');
                await mobileMenuButton.click();
                await page.waitForTimeout(500);

                // Check if mobile navigation appeared
                const mobileNavigation = page.locator('[data-test-id="mobile-navigation"]');
                if (await mobileNavigation.isVisible()) {
                    // Test mobile navigation links
                    const mobileBrowseButton = page.locator('[data-test-id="mobile-browse-events-button"]');
                    const mobileCreateLink = page.locator('[data-test-id="mobile-create-event-link"]');
                    const mobileMyEventsLink = page.locator('[data-test-id="mobile-my-events-link"]');

                    if (await mobileBrowseButton.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="mobile-browse-events-button"]');
                    }

                    if (await mobileCreateLink.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="mobile-create-event-link"]');
                    }

                    if (await mobileMyEventsLink.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="mobile-my-events-link"]');
                    }
                }
            }
        });

        test('should handle mobile search and filters', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile);
            await page.goto('/');

            // Test event filters container on mobile
            const filtersContainer = page.locator('[data-test-id="event-filters-container"]');

            if (await filtersContainer.isVisible()) {
                await testTouchInteraction(page, '[data-test-id="event-filters-container"]');

                // Test category pills on mobile
                const categoryPills = page.locator('[data-test-id="category-pills"]');
                if (await categoryPills.isVisible()) {
                    const workshopPill = page.locator('[data-test-id="category-pill-workshop"]');
                    if (await workshopPill.isVisible()) {
                        await testTouchInteraction(page, '[data-test-id="category-pill-workshop"]');
                        await workshopPill.click();
                        await page.waitForTimeout(500);
                    }
                }
            }
        });
    });

    test.describe('Mobile Performance Testing', () => {

        test('should load quickly on mobile devices', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile);

            const startTime = Date.now();
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            const loadTime = Date.now() - startTime;

            // Mobile should load within reasonable time
            expect(loadTime).toBeLessThan(15000); // 15 seconds for mobile

            // Verify essential mobile elements are visible
            await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
            await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();
            await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeVisible();

            console.log(`Mobile homepage loaded in ${loadTime}ms`);
        });

        test('should handle slow network conditions', async ({ page }) => {
            // Simulate slow 3G connection
            await page.route('**/*', route => {
                setTimeout(() => route.continue(), 100); // Add 100ms delay
            });

            await page.setViewportSize(VIEWPORTS.mobile);
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            // Even with slow network, essential elements should be visible
            await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
            await expect(page.locator('[data-test-id="hero-title"]')).toBeVisible();
        });
    });

    test.describe('Mobile Accessibility Testing', () => {

        test('should have proper touch target sizes', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile);
            await page.goto('/');

            // Test key interactive elements have proper touch target sizes
            const interactiveElements = [
                '[data-test-id="mobile-menu-button"]',
                '[data-test-id="browse-events-button"]',
                '[data-test-id="category-pill-workshop"]',
                '[data-test-id="category-pill-community"]'
            ];

            for (const selector of interactiveElements) {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await testTouchInteraction(page, selector);
                }
            }
        });

        test('should be usable with touch navigation', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile);
            await page.goto('/');

            // Test that content can be navigated via touch
            await page.evaluate(() => window.scrollTo(0, 100));
            await page.waitForTimeout(300);

            const scrollY = await page.evaluate(() => window.scrollY);
            expect(scrollY).toBeGreaterThan(0);

            // Test horizontal scrolling if applicable (e.g., category pills)
            const categoryPills = page.locator('[data-test-id="category-pills"]');
            if (await categoryPills.isVisible()) {
                const pillsBox = await categoryPills.boundingBox();
                if (pillsBox) {
                    // Simulate horizontal scroll gesture
                    await page.mouse.move(pillsBox.x + 100, pillsBox.y + 20);
                    await page.mouse.down();
                    await page.mouse.move(pillsBox.x + 50, pillsBox.y + 20);
                    await page.mouse.up();
                }
            }

            // Verify page is still functional
            await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
        });
    });
}); 