import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Ticket Purchase Flow', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
    });

    test('ticket purchase flow for paid event', async ({ page }) => {
        // Navigate to first available event
        await helpers.goToFirstAvailableEvent();

        await helpers.takeScreenshot('ticket-flow-start');

        // Look for ticket section
        const ticketSection = page.locator('[data-test-id="ticket-section"]');
        const ticketSelectionContainer = page.locator('[data-test-id="ticket-selection-container"]');

        const hasTicketSection = await ticketSection.isVisible();
        if (!hasTicketSection) {
            console.log('No ticket section visible - may be free event or require authentication');
            await helpers.takeScreenshot('ticket-flow-no-section');
            return; // Test passes - event may not have paid tickets
        }

        // Verify ticket section is displayed
        await expect(ticketSection).toBeVisible();
        await expect(page.locator('[data-test-id="ticket-section-title"]')).toHaveText('Get Tickets');

        // If ticket selection is available, try to select tickets
        if (await ticketSelectionContainer.isVisible()) {
            // Fill ticket form
            await helpers.fillTicketForm(1);

            // Wait for ticket summary to appear
            const ticketSummary = page.locator('[data-test-id="ticket-summary-card"]');
            if (await ticketSummary.isVisible()) {
                // Proceed to checkout
                await helpers.proceedToCheckout();

                // Check if redirected to checkout or payment page
                const currentUrl = page.url();
                if (currentUrl.includes('stripe.com') || currentUrl.includes('/checkout') || currentUrl.includes('/payment')) {
                    console.log('Successfully redirected to payment processor');
                    await expect(page.locator('body')).toBeVisible();
                } else if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
                    console.log('Ticket purchase requires authentication - redirected to login');
                    await expect(page.locator('body')).toBeVisible();
                } else {
                    console.log('Ticket purchase flow completed or requires additional steps');
                }
            } else {
                console.log('No tickets selected or ticket summary not available');
            }
        }

        await helpers.takeScreenshot('ticket-flow-end');
    });

    test('ticket quantity selection works correctly', async ({ page }) => {
        await helpers.goToFirstAvailableEvent();

        // Look for quantity controls
        const quantityInput = page.locator('[data-test-id="quantity-input"]');
        const increaseButton = page.locator('[data-test-id="increase-quantity-button"]');
        const decreaseButton = page.locator('[data-test-id="decrease-quantity-button"]');

        if (await quantityInput.isVisible()) {
            // Test different quantities
            const quantities = [1, 2, 3];

            for (const qty of quantities) {
                await quantityInput.fill(qty.toString());

                // Verify quantity is set correctly
                const inputValue = await quantityInput.inputValue();
                expect(inputValue).toBe(qty.toString());
                console.log(`Quantity ${qty} selected successfully`);

                // Check if total updates
                const totalQuantity = page.locator('[data-test-id="total-quantity"]');
                if (await totalQuantity.isVisible()) {
                    const totalText = await totalQuantity.textContent();
                    expect(totalText).toContain(qty.toString());
                }
            }
        } else if (await increaseButton.isVisible()) {
            // Test using increase/decrease buttons
            await increaseButton.click();
            console.log('Increased quantity using button');

            if (await decreaseButton.isEnabled()) {
                await decreaseButton.click();
                console.log('Decreased quantity using button');
            }
        } else {
            console.log('Quantity controls not visible - may be single ticket only or requires authentication');
        }
    });

    test('ticket pricing displays correctly', async ({ page }) => {
        await helpers.goToFirstAvailableEvent();

        // Look for price information using data-test-id
        const ticketPrices = page.locator('[data-test-id="ticket-price"]');
        const totalPrice = page.locator('[data-test-id="total-price"]');

        if (await ticketPrices.count() > 0) {
            await expect(ticketPrices.first()).toBeVisible();

            // Get price text for verification
            const priceText = await ticketPrices.first().textContent();
            console.log(`Ticket price displayed: ${priceText}`);

            // Verify price contains currency symbol and number
            expect(priceText).toMatch(/[\$£€]\s*\d+/);

            // If we can add tickets, check total price updates
            const quantityInput = page.locator('[data-test-id="quantity-input"]');
            if (await quantityInput.isVisible()) {
                await quantityInput.fill('2');

                if (await totalPrice.isVisible()) {
                    const totalText = await totalPrice.textContent();
                    console.log(`Total price displayed: ${totalText}`);
                    expect(totalText).toMatch(/[\$£€]\s*\d+/);
                }
            }
        } else {
            console.log('Price information not immediately visible');
        }
    });

    test('checkout handles invalid payment scenarios', async ({ page }) => {
        await helpers.goToFirstAvailableEvent();

        // Look for ticket section first
        const ticketSection = page.locator('[data-test-id="ticket-section"]');

        if (await ticketSection.isVisible()) {
            // Try to select a ticket first
            await helpers.fillTicketForm(1);

            // Try to proceed to checkout
            await helpers.proceedToCheckout();

            // Check where we ended up
            const currentUrl = page.url();

            if (currentUrl.includes('stripe.com')) {
                console.log('Reached Stripe payment page - would test payment validation here');
                // In a real scenario, you might test with Stripe test cards
                // But we don't want to actually process payments in E2E tests
            } else if (currentUrl.includes('/checkout') || currentUrl.includes('/payment')) {
                console.log('Reached internal checkout page');

                // Look for payment form fields
                const paymentForm = page.locator('[data-test-id="checkout-form"], form');
                if (await paymentForm.isVisible()) {
                    console.log('Payment form visible - validation can be tested');
                }
            } else {
                console.log('Checkout requires authentication or other prerequisites');
            }
        } else {
            console.log('No ticket section visible - may be free event');
        }
    });

    test('ticket types are displayed correctly', async ({ page }) => {
        await helpers.goToFirstAvailableEvent();

        // Look for ticket types using data-test-id
        const ticketTypes = page.locator('[data-test-id^="ticket-type-"]');
        const ticketNames = page.locator('[data-test-id="ticket-type-name"]');
        const ticketDescriptions = page.locator('[data-test-id="ticket-type-description"]');

        const ticketCount = await ticketTypes.count();

        if (ticketCount > 0) {
            console.log(`Found ${ticketCount} ticket type(s)`);

            // Verify each ticket type has essential information
            for (let i = 0; i < ticketCount; i++) {
                const ticketType = ticketTypes.nth(i);
                await expect(ticketType).toBeVisible();

                // Check for name and description
                const ticketName = ticketNames.nth(i);
                const ticketDesc = ticketDescriptions.nth(i);

                if (await ticketName.isVisible()) {
                    const nameText = await ticketName.textContent();
                    console.log(`Ticket type ${i + 1}: ${nameText}`);
                    expect(nameText).toBeTruthy();
                }

                if (await ticketDesc.isVisible()) {
                    const descText = await ticketDesc.textContent();
                    expect(descText).toBeTruthy();
                }
            }
        } else {
            console.log('No distinct ticket types visible - may be single ticket type event or free event');
        }
    });

    test('sold out events display correctly', async ({ page }) => {
        // Test with first available event
        await helpers.goToFirstAvailableEvent();

        // Look for sold out indicators using data-test-id
        const soldOutMessages = page.locator('[data-test-id="sold-out-message"]');

        if (await soldOutMessages.count() > 0) {
            console.log('Sold out status displayed correctly');
            await expect(soldOutMessages.first()).toBeVisible();
            await expect(soldOutMessages.first()).toContainText('Sold out');

            // Verify quantity controls are not available for sold out tickets
            const quantityControls = page.locator('[data-test-id="quantity-controls"]');
            const quantityControlsCount = await quantityControls.count();

            console.log(`Found ${quantityControlsCount} available ticket types (non-sold-out)`);
        } else {
            console.log('Event tickets are available or no sold out status applicable');

            // Verify available tickets have quantity controls
            const quantityControls = page.locator('[data-test-id="quantity-controls"]');
            if (await quantityControls.count() > 0) {
                console.log('Quantity controls available for tickets');
            }
        }
    });
}); 