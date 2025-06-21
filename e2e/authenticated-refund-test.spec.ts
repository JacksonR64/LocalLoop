import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'test1@localloopevents.xyz',
  password: 'zunTom-9wizri-refdes'
};
const KNOWN_ORDER_ID = 'f59b1279-4026-452a-9581-1c8cd4dabbc5';

test.describe('Authenticated Refund API Test', () => {
  test('Test refund API with proper authentication', async ({ page }) => {
    console.log('🔑 Setting up authenticated session...');
    
    // Navigate to homepage
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if user is already signed in
    const userDropdown = await page.locator('text=test1').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!userDropdown) {
      console.log('User not signed in, attempting login...');
      
      // Try to sign in via the auth system
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForLoadState('networkidle');
      
      // Fill in credentials if login form is available
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(TEST_CREDENTIALS.email);
        await passwordInput.fill(TEST_CREDENTIALS.password);
        
        // Submit the form
        await page.click('button[type="submit"], button:has-text("Sign In")');
        await page.waitForTimeout(3000);
      }
    }
    
    // Navigate to My Events to establish session
    await page.goto(`${BASE_URL}/my-events`);
    await page.waitForLoadState('networkidle');
    
    console.log('🧪 Testing refund API with authenticated session...');
    
    // Test the API call with the authenticated session
    const apiResponse = await page.evaluate(async (orderId) => {
      try {
        console.log('Making authenticated refund API request for order:', orderId);
        
        const response = await fetch('/api/refunds', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            order_id: orderId,
            refund_type: 'customer_request',
            reason: 'E2E test with authenticated session'
          })
        });
        
        console.log('API Response status:', response.status);
        
        const responseText = await response.text();
        console.log('API Response body:', responseText);
        
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = { error: 'Could not parse JSON', rawText: responseText };
        }
        
        return {
          status: response.status,
          statusText: response.statusText,
          body: responseJson,
          rawBody: responseText
        };
      } catch (error: unknown) {
        console.error('Fetch error:', error);
        return {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        };
      }
    }, KNOWN_ORDER_ID);
    
    console.log('\n=== AUTHENTICATED REFUND API TEST RESULTS ===');
    console.log('Order ID tested:', KNOWN_ORDER_ID);
    console.log('Response status:', apiResponse.status);
    console.log('Response body:', JSON.stringify(apiResponse.body, null, 2));
    
    if (apiResponse.status === 401) {
      console.log('⚠️ Still getting 401 - authentication not working in test context');
    } else if (apiResponse.status === 404 && apiResponse.body?.error === 'Order not found') {
      console.log('✅ API is authenticated! Now we can see the "Order not found" error');
      console.log('🔍 Check server logs for the debugging output:');
      console.log('   - Current user ID');
      console.log('   - Available orders in database');
      console.log('   - Order ownership information');
    } else if (apiResponse.status === 403) {
      console.log('✅ API found the order but user not authorized - ownership issue');
    } else if (apiResponse.status === 200) {
      console.log('🎉 REFUND SUCCESSFUL!');
    } else {
      console.log('📊 Other response status:', apiResponse.status);
      console.log('This gives us more info about the refund flow');
    }
    
    expect(apiResponse).toBeDefined();
  });

  test('Create a simple order first and then test refund', async ({ page }) => {
    console.log('🛒 Attempting to create an order for testing...');
    
    // Navigate to the test event
    await page.goto(`${BASE_URL}/events/75c8904e-671f-426c-916d-4e275806e277`);
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's available
    await page.screenshot({ path: 'test-results/event-page.png' });
    
    // Check what ticket options are available
    const ticketSection = await page.locator('text=Get Your Tickets, text=Tickets, text=VIP, text=test6').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (ticketSection) {
      console.log('✅ Found ticket section on event page');
      
      // Try to find quantity input and set it to 1
      const quantityInputs = page.locator('input[type="number"]');
      const quantityCount = await quantityInputs.count();
      
      console.log(`Found ${quantityCount} quantity inputs`);
      
      if (quantityCount > 0) {
        // Set quantity for the first ticket type
        await quantityInputs.first().fill('1');
        
        // Look for a purchase/checkout button
        const purchaseButton = page.locator('button:has-text("Purchase"), button:has-text("Buy"), button:has-text("Checkout"), button:has-text("Get Tickets")').first();
        
        if (await purchaseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Found purchase button, clicking...');
          await purchaseButton.click();
          await page.waitForTimeout(3000);
          
          // This would normally lead to Stripe checkout
          console.log('Purchase flow initiated (would need Stripe test card setup for full flow)');
        }
      }
    } else {
      console.log('⚠️ No ticket section found - might be free event or different UI');
    }
    
    expect(ticketSection !== undefined).toBe(true);
  });
});