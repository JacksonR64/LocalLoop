import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_EVENT_ID = '75c8904e-671f-426c-916d-4e275806e277'; // Known test event with paid tickets

test.describe('Mobile Payment Success Scroll Positioning', () => {
  test('Mobile Safari - payment success card positioning', async ({ page }) => {
    
    console.log('📱 Testing mobile payment success scroll positioning...');
    
    // Go directly to test event and simulate payment success
    const eventUrl = `${BASE_URL}/events/${TEST_EVENT_ID}?payment=success&payment_intent=mobile_test_12345`;
    
    console.log('📍 Navigating to event with payment success params...');
    await page.goto(eventUrl, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the payment success card to appear and scroll effect to complete
    console.log('⏳ Waiting for payment success card and scroll...');
    await page.waitForSelector('[data-test-id="payment-success-card"]', { timeout: 10000 });
    
    // Allow extra time for mobile scroll animation to complete
    await page.waitForTimeout(3000);
    
    console.log('📐 Measuring mobile positioning...');
    
    // Get navigation height and card position
    const measurements = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('header');
      const card = document.querySelector('[data-test-id="payment-success-card"]');
      
      if (!card) {
        return { error: 'Card not found' };
      }
      
      const navRect = nav ? nav.getBoundingClientRect() : { height: 0, bottom: 0 };
      const cardRect = card.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      return {
        navHeight: navRect.height,
        navBottom: navRect.bottom,
        cardTop: cardRect.top,
        cardTopInDocument: cardRect.top + scrollY,
        gapBetweenNavAndCard: cardRect.top - navRect.bottom,
        scrollPosition: scrollY,
        viewportHeight: window.innerHeight,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      };
    });
    
    console.log('📊 Mobile positioning measurements:', measurements);
    
    // Take a screenshot specifically for mobile
    console.log('📸 Taking mobile screenshot...');
    await page.screenshot({ 
      path: 'test-results/mobile-payment-success-positioning.png', 
      fullPage: false // Just viewport to see positioning
    });
    
    // Assertions for mobile
    if (!('error' in measurements)) {
      // Card should be visible in viewport
      expect(measurements.cardTop).toBeGreaterThan(0);
      expect(measurements.cardTop).toBeLessThan(measurements.viewportHeight);
      
      console.log(`✅ Mobile Success! Card positioned at ${measurements.cardTop}px from viewport top`);
      console.log(`✅ Mobile scroll position: ${measurements.scrollPosition}px`);
      console.log(`✅ Mobile navigation height: ${measurements.navHeight}px`);
      console.log(`✅ Mobile user agent detected: ${measurements.isMobile}`);
    } else {
      throw new Error(measurements.error);
    }
    
    // Check if we can see the green checkmark
    const checkmarkVisible = await page.locator('[data-test-id="payment-success-card"] svg').first().isVisible();
    console.log(`✅ Mobile green checkmark visible: ${checkmarkVisible}`);
    expect(checkmarkVisible).toBe(true);
    
    // Check if "Payment Successful!" text is visible
    const successTextVisible = await page.locator('text=Payment Successful!').isVisible();
    console.log(`✅ Mobile success text visible: ${successTextVisible}`);
    expect(successTextVisible).toBe(true);
    
    console.log('🎉 Mobile payment success scroll positioning test completed successfully!');
  });
});