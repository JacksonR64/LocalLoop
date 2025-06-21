import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const KNOWN_ORDER_ID = 'f59b1279-4026-452a-9581-1c8cd4dabbc5'; // From previous debugging

test.describe('Simple Refund API Test', () => {
  test('Test refund API directly with browser fetch', async ({ page }) => {
    // Navigate to the site to establish session
    await page.goto(`${BASE_URL}/my-events`);
    await page.waitForLoadState('networkidle');
    
    console.log('🧪 Testing refund API with known order ID:', KNOWN_ORDER_ID);
    
    // Execute the refund API call in the browser context
    const apiResponse = await page.evaluate(async (orderId) => {
      try {
        console.log('Making refund API request for order:', orderId);
        
        const response = await fetch('/api/refunds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            refund_type: 'customer_request',
            reason: 'E2E test with known order ID'
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
          headers: Object.fromEntries(response.headers.entries()),
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
    
    console.log('\n=== REFUND API TEST RESULTS ===');
    console.log('Order ID tested:', KNOWN_ORDER_ID);
    console.log('Response status:', apiResponse.status);
    console.log('Response body:', JSON.stringify(apiResponse.body, null, 2));
    
    if (apiResponse.status === 404 && apiResponse.body?.error === 'Order not found') {
      console.log('✅ Successfully reproduced "Order not found" error');
      console.log('🔍 Check your server terminal for debugging logs including:');
      console.log('   - "Refund request received:" log with order ID');
      console.log('   - "Available orders for debugging:" log with database contents');
      console.log('   - User authentication information');
      console.log('   - Order ownership checks');
    } else if (apiResponse.status === 200) {
      console.log('✅ Refund request succeeded!');
    } else {
      console.log('⚠️ Unexpected response status:', apiResponse.status);
      console.log('Response:', apiResponse);
    }
    
    // The test passes regardless of the API result - we're just collecting debugging info
    expect(apiResponse).toBeDefined();
  });

  test('Test refund API with display ID', async ({ page }) => {
    // Navigate to the site to establish session
    await page.goto(`${BASE_URL}/my-events`);
    await page.waitForLoadState('networkidle');
    
    // Test with just the last 8 characters (display ID)
    const displayId = KNOWN_ORDER_ID.slice(-8); // "4dabbc5" - last 8 chars
    
    console.log('🧪 Testing refund API with display ID:', displayId);
    
    const apiResponse = await page.evaluate(async (orderId) => {
      try {
        const response = await fetch('/api/refunds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            refund_type: 'customer_request',
            reason: 'E2E test with display ID'
          })
        });
        
        const responseText = await response.text();
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = { error: 'Could not parse JSON', rawText: responseText };
        }
        
        return {
          status: response.status,
          body: responseJson,
          rawBody: responseText
        };
      } catch (error: unknown) {
        return {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }, displayId);
    
    console.log('\n=== DISPLAY ID TEST RESULTS ===');
    console.log('Display ID tested:', displayId);
    console.log('Response status:', apiResponse.status);
    console.log('Response body:', JSON.stringify(apiResponse.body, null, 2));
    
    expect(apiResponse).toBeDefined();
  });

  test('Debug: Get current user info', async ({ page }) => {
    await page.goto(`${BASE_URL}/my-events`);
    await page.waitForLoadState('networkidle');
    
    // Get user information from the browser
    const userInfo = await page.evaluate(async () => {
      try {
        // Try to get user info from any global variables or make an auth check
        const authResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.text();
          return {
            authStatus: authResponse.status,
            authData: authData
          };
        }
        
        return {
          authStatus: authResponse.status,
          error: 'Could not get auth info'
        };
      } catch (error: unknown) {
        return {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    console.log('\n=== USER DEBUG INFO ===');
    console.log('Current user info:', userInfo);
    
    expect(userInfo).toBeDefined();
  });
});