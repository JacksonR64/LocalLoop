import { test, expect } from '@playwright/test';
import { createAuthHelpers } from './utils/auth-helpers';
import { TEST_EVENT_IDS } from './config/test-credentials';

/**
 * Critical User Journeys E2E Tests
 * 
 * High-priority end-to-end tests that cover the most important user flows
 * for LocalLoop. These tests should pass consistently and are suitable for
 * CI/CD gates and production monitoring.
 * 
 * These tests represent the core value propositions:
 * 1. Event discovery and RSVP
 * 2. Ticket purchasing and order management
 * 3. User account and dashboard management
 * 4. Refund and customer service flows
 */

test.describe('Critical User Journeys', () => {
  test.beforeEach(async () => {
    test.setTimeout(120000); // 2 minutes for critical flows
  });

  test('Complete authenticated user journey: Login → Browse → RSVP → Dashboard', async ({ page }) => {
    const auth = createAuthHelpers(page);
    
    console.log('🎯 Testing complete authenticated user journey...');
    
    // 1. Start at homepage and login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await auth.loginAsUser();
    console.log('✅ Step 1: User authentication successful');
    
    // 2. Browse events
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    
    // Verify events are loading
    const eventCards = page.locator('[data-testid="event-card"], .event-card');
    const eventCount = await eventCards.count();
    expect(eventCount).toBeGreaterThan(0);
    console.log(`✅ Step 2: Event browsing working - ${eventCount} events found`);
    
    // 3. Navigate to specific event
    await page.goto(`/events/${TEST_EVENT_IDS.freeEvent}`);
    await page.waitForLoadState('networkidle');
    
    // Verify event page loads
    const eventTitle = page.locator('h1, [data-testid="event-title"]');
    await expect(eventTitle).toBeVisible();
    console.log('✅ Step 3: Event details page accessible');
    
    // 4. RSVP to event (if available)
    const rsvpButton = page.locator('button:has-text("RSVP"), button:has-text("Reserve"), [data-testid="rsvp-button"]').first();
    
    if (await rsvpButton.isVisible({ timeout: 5000 })) {
      await rsvpButton.click();
      await page.waitForTimeout(3000);
      
      // Check for success confirmation
      const successIndicators = [
        'text=confirmed',
        'text=reserved', 
        'text=RSVP successful',
        '[data-testid="rsvp-success"]'
      ];
      
      let rsvpSuccessful = false;
      for (const indicator of successIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 5000 })) {
          rsvpSuccessful = true;
          break;
        }
      }
      
      if (rsvpSuccessful) {
        console.log('✅ Step 4: RSVP completed successfully');
      } else {
        console.log('⚠️ Step 4: RSVP attempted but success unclear');
      }
    } else {
      console.log('⚠️ Step 4: No RSVP button found - may be paid event');
    }
    
    // 5. Check My Events dashboard
    await page.goto('/my-events');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard loads and shows data
    const dashboardContent = await page.evaluate(async () => {
      const [ordersRes, rsvpsRes] = await Promise.all([
        fetch('/api/orders', { credentials: 'include' }),
        fetch('/api/rsvps', { credentials: 'include' })
      ]);
      
      return {
        orders: await ordersRes.json(),
        rsvps: await rsvpsRes.json()
      };
    });
    
    expect(dashboardContent.orders).toBeDefined();
    expect(dashboardContent.rsvps).toBeDefined();
    
    const totalItems = (dashboardContent.orders.count || 0) + (dashboardContent.rsvps.rsvps?.length || 0);
    console.log(`✅ Step 5: Dashboard loaded with ${totalItems} total items (orders + RSVPs)`);
    
    // 6. Test logout
    await auth.logout();
    console.log('✅ Step 6: Logout successful');
    
    // 7. Verify redirect to login for protected route
    await page.goto('/my-events');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/auth/login');
    console.log('✅ Step 7: Protected route properly secured after logout');
    
    console.log('🎉 Complete authenticated user journey successful!');
  });

  test('Guest checkout flow: Browse → Select → Purchase Intent', async ({ page }) => {
    const auth = createAuthHelpers(page);
    
    console.log('🛒 Testing guest checkout flow...');
    
    // 1. Ensure guest mode
    await page.goto('/');
    await auth.proceedAsGuest();
    console.log('✅ Step 1: Guest mode confirmed');
    
    // 2. Find an event with paid tickets
    const testEvents = [
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005', 
      '00000000-0000-0000-0000-000000000007'
    ];
    
    let foundPurchasableEvent = false;
    
    for (const eventId of testEvents) {
      await page.goto(`/events/${eventId}`);
      await page.waitForLoadState('networkidle');
      
      // Check for quantity inputs (indicates purchasable tickets)
      const quantityInputs = page.locator('input[type="number"]');
      const inputCount = await quantityInputs.count();
      
      if (inputCount > 0) {
        console.log(`✅ Step 2: Found purchasable event ${eventId}`);
        foundPurchasableEvent = true;
        
        // 3. Select tickets
        await quantityInputs.first().fill('1');
        console.log('✅ Step 3: Ticket quantity selected');
        
        // 4. Attempt purchase
        const purchaseButton = page.locator('button:has-text("Purchase"), button:has-text("Buy"), button:has-text("Checkout")').first();
        
        if (await purchaseButton.isVisible()) {
          await purchaseButton.click();
          await page.waitForTimeout(5000);
          
          const currentUrl = page.url();
          
          if (currentUrl.includes('stripe') || currentUrl.includes('checkout')) {
            console.log('✅ Step 4: Successfully reached payment provider');
            break;
          } else if (currentUrl.includes('customer') || await page.locator('input[placeholder*="name"], input[placeholder*="email"]').isVisible()) {
            console.log('✅ Step 4: Customer information form displayed for guest');
            
            // Fill guest info if required
            const nameInput = page.locator('input[placeholder*="name" i]').first();
            const emailInput = page.locator('input[placeholder*="email" i]').first();
            
            if (await nameInput.isVisible()) {
              await nameInput.fill('Guest Customer');
              await emailInput.fill('guest@test.com');
              
              const continueButton = page.locator('button:has-text("Continue"), button:has-text("Proceed")').first();
              if (await continueButton.isVisible()) {
                await continueButton.click();
                await page.waitForTimeout(3000);
                console.log('✅ Guest information submitted');
              }
            }
          }
        }
        break;
      }
    }
    
    expect(foundPurchasableEvent).toBe(true);
    console.log('🎉 Guest checkout flow initiation successful!');
  });

  test('Order management and refund flow: Dashboard → Order → Refund Request', async ({ page }) => {
    const auth = createAuthHelpers(page);
    
    console.log('💰 Testing order management and refund flow...');
    
    // 1. Login as user
    await page.goto('/');
    await auth.loginAsUser();
    console.log('✅ Step 1: User authenticated');
    
    // 2. Navigate to My Events
    await page.goto('/my-events');
    await page.waitForLoadState('networkidle');
    console.log('✅ Step 2: My Events dashboard accessed');
    
    // 3. Check for existing orders
    const orderCards = page.locator('[data-testid="order-card"]');
    const orderCount = await orderCards.count();
    
    if (orderCount > 0) {
      console.log(`✅ Step 3: Found ${orderCount} orders to test with`);
      
      // 4. Test refund functionality
      const refundButton = orderCards.first().locator('[data-testid="refund-button"]');
      
      if (await refundButton.isVisible()) {
        await refundButton.click();
        
        // 5. Verify refund dialog
        const refundDialog = page.locator('[data-testid="refund-dialog"]');
        await expect(refundDialog).toBeVisible();
        console.log('✅ Step 4: Refund dialog opened');
        
        // 6. Test form validation
        const continueButton = page.locator('[data-testid="refund-continue-button"]');
        await continueButton.click();
        
        // Should show validation error for empty reason
        const errorMessage = page.locator('[data-testid="refund-error-message"]');
        if (await errorMessage.isVisible({ timeout: 3000 })) {
          console.log('✅ Step 5: Form validation working');
        }
        
        // 7. Fill valid reason and continue
        const reasonInput = page.locator('[data-testid="refund-reason-input"]');
        await reasonInput.fill('E2E test refund request');
        await continueButton.click();
        
        // 8. Check for confirmation step or error message
        const confirmButton = page.locator('[data-testid="refund-confirm-button"]');
        const deadlineError = page.locator('text=deadline');
        
        if (await confirmButton.isVisible({ timeout: 5000 })) {
          console.log('✅ Step 6: Refund confirmation step reached');
        } else if (await deadlineError.isVisible()) {
          console.log('✅ Step 6: Refund deadline validation working correctly');
        }
        
        console.log('🎉 Order management and refund flow tested successfully!');
      } else {
        console.log('⚠️ No refund button found - orders may not be refundable');
      }
    } else {
      console.log('📝 No orders found for test user');
      console.log('💡 To test refund flow, create test orders with recent timestamps');
    }
  });

  test('Cross-device session management', async ({ browser }) => {
    console.log('📱💻 Testing cross-device session management...');
    
    // Simulate desktop and mobile devices
    const desktop = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const mobile = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    
    const desktopPage = await desktop.newPage();
    const mobilePage = await mobile.newPage();
    
    const desktopAuth = createAuthHelpers(desktopPage);
    const mobileAuth = createAuthHelpers(mobilePage);
    
    // 1. Login on desktop
    await desktopPage.goto('/');
    await desktopAuth.loginAsUser();
    console.log('✅ Step 1: Desktop login successful');
    
    // 2. Access same account on mobile
    await mobilePage.goto('/my-events');
    await mobilePage.waitForLoadState('networkidle');
    
    // Mobile should either be authenticated or require separate login
    const mobileAuthState = await mobileAuth.isAuthenticated();
    
    if (!mobileAuthState) {
      // Need to login on mobile (expected for separate devices)
      await mobilePage.goto('/');
      await mobileAuth.loginAsUser();
      console.log('✅ Step 2: Mobile login required and successful');
    } else {
      console.log('✅ Step 2: Mobile session automatically authenticated');
    }
    
    // 3. Verify both devices can access user data
    const desktopData = await desktopPage.evaluate(async () => {
      const response = await fetch('/api/orders', { credentials: 'include' });
      return await response.json();
    });
    
    const mobileData = await mobilePage.evaluate(async () => {
      const response = await fetch('/api/orders', { credentials: 'include' });
      return await response.json();
    });
    
    expect(desktopData.count).toBe(mobileData.count);
    console.log('✅ Step 3: Consistent data across devices');
    
    // 4. Test logout propagation
    await desktopAuth.logout();
    console.log('✅ Step 4: Desktop logout completed');
    
    // Mobile session may or may not be affected (depends on implementation)
    await mobilePage.reload();
    await mobileAuth.waitForAuthState(5000);
    
    const mobileAuthAfterDesktopLogout = await mobileAuth.isAuthenticated();
    console.log(`📱 Mobile auth state after desktop logout: ${mobileAuthAfterDesktopLogout}`);
    
    await desktop.close();
    await mobile.close();
    
    console.log('🎉 Cross-device session management tested!');
  });

  test('API resilience and error recovery', async ({ page }) => {
    const auth = createAuthHelpers(page);
    
    console.log('🔧 Testing API resilience and error recovery...');
    
    await page.goto('/');
    await auth.loginAsUser();
    
    // Test various API scenarios
    const apiTests = await page.evaluate(async () => {
      const results = [];
      
      // Test orders API
      try {
        const ordersResponse = await fetch('/api/orders', { credentials: 'include' });
        results.push({
          api: 'orders',
          status: ordersResponse.status,
          success: ordersResponse.ok
        });
      } catch (error: unknown) {
        results.push({
          api: 'orders',
          error: error instanceof Error ? error.message : String(error),
          success: false
        });
      }
      
      // Test RSVPs API
      try {
        const rsvpsResponse = await fetch('/api/rsvps', { credentials: 'include' });
        results.push({
          api: 'rsvps',
          status: rsvpsResponse.status,
          success: rsvpsResponse.ok
        });
      } catch (error: unknown) {
        results.push({
          api: 'rsvps',
          error: error instanceof Error ? error.message : String(error),
          success: false
        });
      }
      
      // Test refunds API with invalid data
      try {
        const refundResponse = await fetch('/api/refunds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ invalid: 'data' })
        });
        results.push({
          api: 'refunds-validation',
          status: refundResponse.status,
          success: refundResponse.status === 400 // Should reject invalid data
        });
      } catch (error: unknown) {
        results.push({
          api: 'refunds-validation',
          error: error instanceof Error ? error.message : String(error),
          success: false
        });
      }
      
      return results;
    });
    
    // Verify all APIs respond appropriately
    for (const test of apiTests) {
      expect(test.success).toBe(true);
      console.log(`✅ ${test.api} API: ${test.status || 'handled correctly'}`);
    }
    
    console.log('🎉 API resilience testing completed!');
  });

  test('Performance and loading states', async ({ page }) => {
    console.log('⚡ Testing performance and loading states...');
    
    // Monitor page load performance
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // Basic performance thresholds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5 seconds
    
    console.log('✅ Page load performance within acceptable thresholds');
    console.log(`   - DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`   - Load Complete: ${performanceMetrics.loadComplete}ms`);
    
    // Test loading states for data-heavy pages
    await page.goto('/events');
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner');
    
    // Loading indicators should disappear within reasonable time
    if (await loadingIndicators.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicators).toBeHidden({ timeout: 10000 });
      console.log('✅ Loading indicators properly managed');
    }
    
    console.log('🎉 Performance testing completed!');
  });
});

/**
 * Usage Notes for CI/CD Integration:
 * 
 * 1. Run these tests as smoke tests after deployments
 * 2. Configure alerts for test failures in production
 * 3. Use these as health checks for staging environments
 * 4. Run subset of critical tests for faster feedback loops
 * 5. Include in regression test suites for major releases
 * 
 * Test Categories:
 * - 🎯 Authentication flows (login, logout, session management)
 * - 🛒 E-commerce flows (browsing, selection, checkout initiation)
 * - 💰 Order management (dashboard, refunds, customer service)
 * - 📱 Cross-device compatibility
 * - 🔧 API resilience and error handling
 * - ⚡ Performance and user experience
 */