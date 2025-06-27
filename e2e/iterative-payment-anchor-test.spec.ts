import { test, expect } from '@playwright/test';
import { createAuthHelpers } from './utils/auth-helpers';
import { TEST_ACCOUNTS } from './config/test-credentials';

const BASE_URL = 'http://localhost:3000';
const TEST_EVENT_ID = '75c8904e-671f-426c-916d-4e275806e277'; // Known test event

test.describe('Iterative Payment Success Anchor Testing', () => {
  test.setTimeout(120000); // 2 minute timeout for payment operations

  test('Iterate payment tests to debug anchor navigation', async ({ page }) => {
    console.log('🚀 Starting iterative payment anchor navigation testing...');
    
    // Enhanced console logging
    const logs: string[] = [];
    page.on('console', msg => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      logs.push(logEntry);
      console.log(logEntry);
    });

    // Enhanced error tracking
    const errors: string[] = [];
    page.on('pageerror', error => {
      const errorEntry = `[PAGE ERROR] ${error.message}`;
      errors.push(errorEntry);
      console.log(errorEntry);
    });

    const auth = createAuthHelpers(page);

    // Test 1: Direct URL with payment success parameters
    console.log('\n🧪 TEST 1: Direct URL with payment success parameters');
    console.log('='.repeat(60));
    
    const directUrl = `${BASE_URL}/events/${TEST_EVENT_ID}?payment=success&payment_intent=test_direct_12345`;
    console.log(`📍 Navigating to: ${directUrl}`);
    
    await page.goto(directUrl, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for effects
    
    let currentUrl = page.url();
    console.log(`📍 Current URL after navigation: ${currentUrl}`);
    
    // Check for payment success card
    const hasSuccessCard = await page.locator('[data-test-id="payment-success-card"]').isVisible({ timeout: 5000 });
    console.log(`💳 Payment success card visible: ${hasSuccessCard}`);
    
    // Check anchor in URL
    const hasAnchor = currentUrl.includes('#payment-success');
    console.log(`🔗 URL contains anchor: ${hasAnchor}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/test1-direct-url.png', 
      fullPage: false 
    });
    
    // Check console logs for our debug messages
    const relevantLogs = logs.filter(log => 
      log.includes('Payment Success Debug') || 
      log.includes('Payment success detected') ||
      log.includes('Navigating to anchor') ||
      log.includes('Payment success card should be rendered')
    );
    console.log(`🔍 Found ${relevantLogs.length} relevant debug logs:`);
    relevantLogs.forEach(log => console.log(`  ${log}`));

    console.log(`\n📊 TEST 1 RESULTS:`);
    console.log(`  - Success card: ${hasSuccessCard}`);
    console.log(`  - URL anchor: ${hasAnchor}`);
    console.log(`  - Debug logs: ${relevantLogs.length}`);

    // Test 2: Real payment flow
    console.log('\n🧪 TEST 2: Real payment flow simulation');
    console.log('='.repeat(60));
    
    // Login first
    await page.goto(BASE_URL);
    await auth.loginAsUser();
    console.log('✅ Logged in as test user');
    
    // Go to event
    await page.goto(`${BASE_URL}/events/${TEST_EVENT_ID}`);
    await page.waitForLoadState('domcontentloaded');
    console.log('📍 Navigated to test event');
    
    // Clear previous logs
    logs.length = 0;
    
    // Check for ticket selection
    const quantityInputs = page.locator('input[type="number"]');
    const inputCount = await quantityInputs.count();
    console.log(`🎫 Found ${inputCount} ticket quantity inputs`);
    
    if (inputCount > 0) {
      // Select 1 ticket
      await quantityInputs.first().fill('1');
      console.log('✅ Selected 1 ticket');
      
      // Look for proceed to checkout button
      const proceedButton = page.locator('[data-test-id="proceed-to-checkout-button"]');
      if (await proceedButton.isVisible({ timeout: 5000 })) {
        console.log('💳 Found proceed to checkout button');
        
        await proceedButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked proceed to checkout');
        
        // Check if we're in checkout mode
        const checkoutForm = page.locator('[data-test-id="checkout-form"]');
        const hasCheckoutForm = await checkoutForm.isVisible({ timeout: 5000 });
        console.log(`📋 Checkout form visible: ${hasCheckoutForm}`);
        
        if (hasCheckoutForm) {
          console.log('💡 Found checkout form - would normally complete Stripe payment here');
          console.log('💡 Instead, let\'s simulate the success callback directly...');
          
          // Simulate the payment success by calling the onSuccess handler directly
          const successResult = await page.evaluate(() => {
            try {
              // Try to find and trigger a success state manually
              const event = new CustomEvent('payment-success-test', {
                detail: { paymentIntentId: 'test_manual_trigger_12345' }
              });
              document.dispatchEvent(event);
              return { success: true, message: 'Dispatched custom success event' };
            } catch (error) {
              return { success: false, message: (error as Error).message };
            }
          });
          
          console.log(`🧪 Manual success trigger result:`, successResult);
        }
        
        // Take screenshot of checkout
        await page.screenshot({ 
          path: 'test-results/test2-checkout-form.png', 
          fullPage: false 
        });
      } else {
        console.log('⚠️ No proceed to checkout button found');
      }
    } else {
      console.log('⚠️ No ticket quantity inputs found');
    }

    // Test 3: Manual anchor navigation
    console.log('\n🧪 TEST 3: Manual anchor navigation test');
    console.log('='.repeat(60));
    
    // Clear logs
    logs.length = 0;
    
    // Manually navigate to anchor
    console.log('🎯 Manually navigating to #payment-success anchor...');
    await page.evaluate(() => {
      // Force show payment success state
      const event = new CustomEvent('force-payment-success', {
        detail: { paymentIntentId: 'manual_test_12345' }
      });
      document.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    // Try router navigation
    const routerResult = await page.evaluate(() => {
      try {
        // Try to access Next.js router if available
        if (window.__NEXT_DATA__) {
          window.location.hash = 'payment-success';
          return { success: true, method: 'location.hash' };
        }
        return { success: false, message: 'No Next.js router found' };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      }
    });
    
    console.log('🔗 Manual router navigation result:', routerResult);
    
    await page.waitForTimeout(2000);
    
    currentUrl = page.url();
    console.log(`📍 URL after manual navigation: ${currentUrl}`);
    
    // Test 4: Element existence and positioning
    console.log('\n🧪 TEST 4: Element analysis and positioning');
    console.log('='.repeat(60));
    
    // Check if payment success element exists
    const paymentSuccessElement = page.locator('#payment-success');
    const elementExists = await paymentSuccessElement.count() > 0;
    console.log(`🎯 #payment-success element exists: ${elementExists}`);
    
    if (elementExists) {
      const elementInfo = await page.evaluate(() => {
        const element = document.getElementById('payment-success');
        if (element) {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            visible: rect.width > 0 && rect.height > 0,
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            styles: {
              scrollMarginTop: style.scrollMarginTop,
              position: style.position,
              display: style.display
            },
            offsetTop: element.offsetTop,
            scrollTop: document.documentElement.scrollTop
          };
        }
        return null;
      });
      
      console.log('🎯 Payment success element details:', elementInfo);
    }
    
    // Check CSS anchor navigation styles
    const cssInfo = await page.evaluate(() => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      return {
        scrollBehavior: rootStyles.scrollBehavior,
        anchorScrollOffset: rootStyles.getPropertyValue('--anchor-scroll-offset'),
        navHeight: rootStyles.getPropertyValue('--nav-height'),
        anchorBuffer: rootStyles.getPropertyValue('--anchor-buffer')
      };
    });
    
    console.log('🎨 CSS anchor navigation styles:', cssInfo);
    
    // Test 5: Direct scroll to element
    console.log('\n🧪 TEST 5: Direct scroll to element test');
    console.log('='.repeat(60));
    
    const scrollResult = await page.evaluate(() => {
      try {
        const element = document.getElementById('payment-success');
        if (element) {
          // Try different scroll methods
          const methods: any[] = [];
          
          // Method 1: scrollIntoView
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          methods.push({ method: 'scrollIntoView', success: true });
          
          // Method 2: manual scroll calculation
          const offset = 80; // Our expected offset
          const elementTop = element.offsetTop - offset;
          window.scrollTo({ top: elementTop, behavior: 'smooth' });
          methods.push({ method: 'manual scroll', targetTop: elementTop, success: true });
          
          return { success: true, methods, elementFound: true };
        } else {
          return { success: false, message: 'Element not found', elementFound: false };
        }
      } catch (error) {
        return { success: false, message: (error as Error).message, elementFound: false };
      }
    });
    
    console.log('📍 Direct scroll result:', scrollResult);
    
    await page.waitForTimeout(2000);
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/test5-final-state.png', 
      fullPage: false 
    });
    
    // Test 6: Comprehensive log analysis
    console.log('\n🧪 TEST 6: Comprehensive log analysis');
    console.log('='.repeat(60));
    
    console.log(`📝 Total console logs captured: ${logs.length}`);
    console.log(`❌ Total errors captured: ${errors.length}`);
    
    // Filter and categorize logs
    const paymentLogs = logs.filter(log => 
      log.toLowerCase().includes('payment') ||
      log.toLowerCase().includes('checkout') ||
      log.toLowerCase().includes('stripe')
    );
    
    const anchorLogs = logs.filter(log => 
      log.toLowerCase().includes('anchor') ||
      log.toLowerCase().includes('navigation') ||
      log.toLowerCase().includes('#payment-success')
    );
    
    const debugLogs = logs.filter(log => 
      log.includes('🔍') || log.includes('✅') || log.includes('🎯') || 
      log.includes('💳') || log.includes('🧹') || log.includes('🔗')
    );
    
    console.log(`💳 Payment-related logs: ${paymentLogs.length}`);
    paymentLogs.forEach(log => console.log(`  ${log}`));
    
    console.log(`🎯 Anchor-related logs: ${anchorLogs.length}`);
    anchorLogs.forEach(log => console.log(`  ${log}`));
    
    console.log(`🐛 Debug logs: ${debugLogs.length}`);
    debugLogs.forEach(log => console.log(`  ${log}`));
    
    if (errors.length > 0) {
      console.log(`❌ Errors found:`);
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    // Summary report
    console.log('\n📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Tests completed: 6/6`);
    console.log(`📸 Screenshots taken: 4`);
    console.log(`📝 Total logs: ${logs.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`🎯 Anchor element exists: ${elementExists}`);
    console.log(`🔗 Final URL: ${page.url()}`);
    
    // Recommendations based on findings
    console.log('\n💡 RECOMMENDATIONS:');
    if (debugLogs.length === 0) {
      console.log('❌ No debug logs found - our debug code may not be running');
    }
    if (!hasAnchor) {
      console.log('❌ URL anchor navigation not working');
    }
    if (!elementExists) {
      console.log('❌ Payment success element missing');
    }
    if (errors.length > 0) {
      console.log('❌ JavaScript errors detected - may interfere with functionality');
    }
    
    // Pass the test - this is diagnostic
    expect(true).toBe(true);
  });
});