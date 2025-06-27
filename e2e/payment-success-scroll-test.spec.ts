import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_EVENT_ID = '75c8904e-671f-426c-916d-4e275806e277'; // Known test event with paid tickets

test.describe('Payment Success Scroll Positioning', () => {
  test('After successful payment, payment success card should be positioned correctly', async ({ page }) => {
    
    console.log('🧪 Testing payment success scroll positioning...');
    
    // Go directly to test event and simulate payment success
    const eventUrl = `${BASE_URL}/events/${TEST_EVENT_ID}?payment=success&payment_intent=test_payment_intent_12345`;
    
    console.log('📍 Navigating to event with payment success params...');
    await page.goto(eventUrl, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the payment success card to appear and scroll effect to complete
    console.log('⏳ Waiting for payment success card and scroll...');
    await page.waitForSelector('[data-test-id="payment-success-card"]', { timeout: 10000 });
    
    // Allow time for scroll animation to complete
    await page.waitForTimeout(2000);
    
    console.log('📐 Measuring positioning...');
    
    // Get navigation height and card position + CSS debugging
    const measurements = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('[data-test-id="navigation"]') || document.querySelector('header');
      const card = document.querySelector('[data-test-id="payment-success-card"]');
      const paymentSuccessElement = document.getElementById('payment-success');
      
      if (!nav || !card) {
        return { error: 'Nav or card not found' };
      }
      
      const navRect = nav.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // CSS debugging
      const cardStyles = window.getComputedStyle(card);
      const paymentSuccessStyles = paymentSuccessElement ? window.getComputedStyle(paymentSuccessElement) : null;
      const rootStyles = window.getComputedStyle(document.documentElement);
      
      return {
        navHeight: navRect.height,
        navBottom: navRect.bottom,
        cardTop: cardRect.top,
        cardTopInDocument: cardRect.top + scrollY,
        gapBetweenNavAndCard: cardRect.top - navRect.bottom,
        scrollPosition: scrollY,
        viewportHeight: window.innerHeight,
        // CSS debugging info
        cardId: card.id,
        cardScrollMarginTop: cardStyles.scrollMarginTop,
        paymentSuccessElementExists: !!paymentSuccessElement,
        paymentSuccessScrollMarginTop: paymentSuccessStyles?.scrollMarginTop || 'N/A',
        anchorScrollOffset: rootStyles.getPropertyValue('--anchor-scroll-offset'),
        navHeightVar: rootStyles.getPropertyValue('--nav-height'),
        anchorBufferVar: rootStyles.getPropertyValue('--anchor-buffer'),
        currentUrl: window.location.href,
        hasAnchor: window.location.hash === '#payment-success'
      };
    });
    
    console.log('📊 Positioning measurements:', measurements);
    
    // Take a screenshot to verify positioning
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'test-results/payment-success-scroll-positioning.png', 
      fullPage: false // Just viewport to see positioning
    });
    
    // Assertions to verify correct positioning
    if (!('error' in measurements)) {
      // Card should be visible in viewport (not hidden behind nav)
      expect(measurements.cardTop).toBeGreaterThan(measurements.navBottom);
      
      // Gap between nav and card should be reasonable
      // Mobile might have larger gaps due to different navigation detection
      const maxGap = measurements.navHeight === 0 ? 100 : 50; // Allow larger gap if nav not detected
      expect(measurements.gapBetweenNavAndCard).toBeGreaterThan(2);
      expect(measurements.gapBetweenNavAndCard).toBeLessThan(maxGap);
      
      console.log(`✅ Success! Card is positioned ${measurements.gapBetweenNavAndCard}px below navigation`);
      console.log(`✅ Navigation height: ${measurements.navHeight}px`);
      console.log(`✅ Card top position: ${measurements.cardTop}px from viewport top`);
    } else {
      throw new Error(measurements.error);
    }
    
    // Check if we can see the green checkmark (first svg which is the checkmark)
    const checkmarkVisible = await page.locator('[data-test-id="payment-success-card"] svg').first().isVisible();
    console.log(`✅ Green checkmark visible: ${checkmarkVisible}`);
    expect(checkmarkVisible).toBe(true);
    
    // Check if "Payment Successful!" text is visible
    const successTextVisible = await page.locator('text=Payment Successful!').isVisible();
    console.log(`✅ Success text visible: ${successTextVisible}`);
    expect(successTextVisible).toBe(true);
    
    console.log('🎉 Payment success scroll positioning test completed successfully!');
  });
});