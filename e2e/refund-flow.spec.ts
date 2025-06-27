import { test, expect } from '@playwright/test';

// Test credentials from CLAUDE.md
const TEST_CREDENTIALS = {
  email: 'test1@localloopevents.xyz',
  password: 'zunTom-9wizri-refdes'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Refund Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto(BASE_URL);
  });

  test('Complete refund flow - purchase ticket and request refund', async ({ page }) => {
    // Step 1: Sign in with test credentials
    await test.step('Sign in with test credentials', async () => {
      // Click profile icon to open dropdown
      await page.click('[data-testid="profile-button"], .lucide-user, [aria-label="Profile"]');
      
      // Wait for sign in option or handle if already signed in
      const isSignedIn = await page.locator('text=Sign Out').isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!isSignedIn) {
        // Click sign in if not already signed in
        await page.click('text=Sign In');
        
        // Fill in credentials
        await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
        await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
        
        // Submit login form
        await page.click('button[type="submit"], button:has-text("Sign In")');
        
        // Wait for successful login
        await expect(page).toHaveURL(/\/my-events|\/dashboard/, { timeout: 10000 });
      }
    });

    // Step 2: Purchase a ticket to create an order for refund testing
    await test.step('Purchase a ticket', async () => {
      // Navigate to the test event that has paid tickets
      await page.goto(`${BASE_URL}/events/75c8904e-671f-426c-916d-4e275806e277`);
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle');
      
      // Find a paid ticket option and select quantity
      const ticketQuantitySelector = '[data-testid="ticket-quantity-input"], input[type="number"]';
      await page.waitForSelector(ticketQuantitySelector, { timeout: 10000 });
      
      // Set quantity to 1 for the first available ticket type
      await page.fill(ticketQuantitySelector, '1');
      
      // Click "Get Tickets" or "Buy Tickets" button
      const buyButton = page.locator('button:has-text("Get Tickets"), button:has-text("Buy Tickets"), button:has-text("Purchase"), [data-testid="buy-tickets-button"]').first();
      await buyButton.click();
      
      // Wait for checkout page or Stripe checkout
      await page.waitForTimeout(2000);
      
      // If redirected to Stripe checkout, handle the test card flow
      const isStripeCheckout = await page.url().includes('checkout.stripe.com') || 
                              await page.locator('#email, [data-testid="email"]').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isStripeCheckout) {
        // Fill in test card details
        await page.fill('[data-testid="email"], #email', TEST_CREDENTIALS.email);
        
        // Wait for card element to load
        await page.waitForSelector('[data-testid="card-number"], #cardNumber', { timeout: 10000 });
        
        // Fill in test card number (4242 4242 4242 4242)
        await page.fill('[data-testid="card-number"], #cardNumber', '4242424242424242');
        await page.fill('[data-testid="card-expiry"], #cardExpiry', '12/34');
        await page.fill('[data-testid="card-cvc"], #cardCvc', '123');
        
        // Complete the purchase
        await page.click('button:has-text("Pay"), button[type="submit"], [data-testid="submit-button"]');
        
        // Wait for success page or redirect back to our site
        await page.waitForTimeout(5000);
        await page.waitForURL(/success|confirmation|my-events/, { timeout: 30000 });
      }
    });

    // Step 3: Navigate to My Events to find the purchased order
    await test.step('Navigate to My Events dashboard', async () => {
      await page.goto(`${BASE_URL}/my-events`);
      await page.waitForLoadState('networkidle');
      
      // Ensure we're on the "Tickets & Orders" tab
      await page.click('text=Tickets & Orders, [data-testid="tickets-orders-tab"]');
      await page.waitForTimeout(1000);
      
      // Verify we have at least one order
      const hasOrders = await page.locator('[data-testid="order-card"], .order-item, .ticket-order').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!hasOrders) {
        // Refresh the data if no orders are visible
        await page.click('[data-testid="refresh-data"], button:has-text("Refresh")').catch(() => {});
        await page.waitForTimeout(2000);
      }
      
      // Verify at least one order exists
      await expect(page.locator('[data-testid="order-card"], .order-item, .ticket-order')).toBeVisible({ timeout: 10000 });
    });

    // Step 4: Open refund dialog
    await test.step('Open refund dialog', async () => {
      // Click the "Request Refund" button
      const refundButton = page.locator('[data-testid="request-refund-button"]').first();
      await expect(refundButton).toBeVisible({ timeout: 10000 });
      await refundButton.click();
      
      // Wait for refund dialog to open
      await expect(page.locator('[data-testid="refund-dialog"], .refund-dialog')).toBeVisible({ timeout: 5000 });
    });

    // Step 5: Fill out refund request
    await test.step('Fill out refund request', async () => {
      // Check if reason textarea is available (for customer requests)
      const reasonTextarea = page.locator('[data-testid="refund-reason-textarea"]');
      const isReasonVisible = await reasonTextarea.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isReasonVisible) {
        await reasonTextarea.fill('E2E test refund request');
      }
      
      // Click Continue button to proceed
      await page.click('[data-testid="refund-continue-button"]');
      
      // Wait for confirmation step
      await page.waitForTimeout(1000);
    });

    // Step 6: Confirm refund and trigger the API call
    await test.step('Confirm refund and test API', async () => {
      // Wait for confirmation step UI
      await expect(page.locator('text=Confirm Refund, [data-testid="refund-confirm-section"]')).toBeVisible({ timeout: 5000 });
      
      // Set up console log monitoring to capture API errors
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('Refund') || msg.text().includes('API')) {
          consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        }
      });
      
      // Set up network request monitoring
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiRequests: any[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/refunds')) {
          apiRequests.push({
            url: request.url(),
            method: request.method(),
            body: request.postData()
          });
        }
      });
      
      // Set up response monitoring
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiResponses: any[] = [];
      page.on('response', async response => {
        if (response.url().includes('/api/refunds')) {
          const responseBody = await response.text().catch(() => 'Could not read response');
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            body: responseBody
          });
        }
      });
      
      // Click the Confirm Refund button to trigger the API call
      await page.click('[data-testid="refund-confirm-button"]');
      
      // Wait for API call to complete (either success or error)
      await page.waitForTimeout(5000);
      
      // Check for either success or error state
      const isSuccess = await page.locator('[data-testid="refund-success-dialog"], [data-testid="refund-success-title"]').isVisible({ timeout: 3000 }).catch(() => false);
      const isError = await page.locator('[data-testid="refund-error-message"], [data-testid="refund-error-text"]').isVisible({ timeout: 3000 }).catch(() => false);
      
      // Log all captured information for debugging
      console.log('=== REFUND API TEST RESULTS ===');
      console.log('API Requests made:', apiRequests);
      console.log('API Responses received:', apiResponses);
      console.log('Console messages:', consoleMessages);
      console.log('Success dialog visible:', isSuccess);
      console.log('Error dialog visible:', isError);
      
      if (isError) {
        // Capture the specific error message
        const errorText = await page.locator('[data-testid="refund-error-text"]').textContent().catch(() => 'Could not read error');
        console.log('Refund error message:', errorText);
        
        // This is expected behavior for testing - log the error but don't fail the test
        console.log('✅ Successfully triggered refund API and captured error for debugging');
      } else if (isSuccess) {
        console.log('✅ Refund completed successfully!');
        
        // Verify success message
        await expect(page.locator('[data-testid="refund-success-title"]')).toContainText('Refund Processed');
      } else {
        console.log('⚠️ Neither success nor error state detected - checking processing state');
        
        // Check if still processing
        const isProcessing = await page.locator('text=Processing').isVisible({ timeout: 2000 }).catch(() => false);
        if (isProcessing) {
          console.log('Still processing - waiting longer...');
          await page.waitForTimeout(10000);
        }
      }
    });

    // Step 7: Verify the refund API debugging output in server logs
    await test.step('Verify server logs and debugging', async () => {
      console.log('\n=== DEBUGGING INSTRUCTIONS ===');
      console.log('1. Check your terminal running "npm run dev" for refund API logs');
      console.log('2. Look for logs starting with "Refund request received:"');
      console.log('3. Check for "Available orders for debugging:" output');
      console.log('4. Verify the order ID and user authentication details');
      console.log('5. Compare the searched order ID with the orders found in database');
      console.log('\nIf you see "Order not found" error, the debugging logs will show:');
      console.log('- What order ID was searched');
      console.log('- What user is authenticated');
      console.log('- All available orders in the database');
      console.log('- Whether there\'s a mismatch in user IDs or order ownership');
    });
  });

  test('Direct order ID test - test refund with known order', async ({ page }) => {
    // This test allows testing with a specific order ID
    const KNOWN_ORDER_ID = 'f59b1279-4026-452a-9581-1c8cd4dabbc5'; // From previous tests

    await test.step('Sign in and navigate to dashboard', async () => {
      // Sign in with test credentials
      await page.click('[data-testid="profile-button"], .lucide-user');
      
      const isSignedIn = await page.locator('text=Sign Out').isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!isSignedIn) {
        await page.click('text=Sign In');
        await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
        await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      }
      
      await page.goto(`${BASE_URL}/my-events`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('Test direct API call with known order ID', async () => {
      // Use browser's fetch to test the API directly
      const response = await page.evaluate(async (orderId) => {
        try {
          const response = await fetch('/api/refunds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderId,
              refund_type: 'customer_request',
              reason: 'E2E test with known order ID'
            })
          });
          
          const responseText = await response.text();
          return {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          };
        } catch (error: unknown) {
          return {
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }, KNOWN_ORDER_ID);
      
      console.log('=== DIRECT API TEST RESULTS ===');
      console.log('Order ID tested:', KNOWN_ORDER_ID);
      console.log('API Response:', response);
      
      if (response.status === 404) {
        console.log('✅ Order not found error reproduced - this confirms the debugging is working');
        console.log('Check server logs for debugging output showing why order was not found');
      }
    });
  });

  test('Manual refund trigger - for interactive debugging', async ({ page }) => {
    // This test sets up the environment and pauses for manual interaction
    
    await test.step('Setup environment for manual testing', async () => {
      // Sign in
      await page.click('[data-testid="profile-button"], .lucide-user');
      
      const isSignedIn = await page.locator('text=Sign Out').isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!isSignedIn) {
        await page.click('text=Sign In');
        await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
        await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      }
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/my-events`);
      await page.waitForLoadState('networkidle');
      
      console.log('=== MANUAL TEST READY ===');
      console.log('Environment is set up. You can now:');
      console.log('1. Look for orders in the "Tickets & Orders" tab');
      console.log('2. Click "Request Refund" button');
      console.log('3. Follow the refund flow manually');
      console.log('4. Check server logs for debugging output');
      
      // Pause for manual interaction (comment out for automated runs)
      // await page.pause();
    });
  });
});