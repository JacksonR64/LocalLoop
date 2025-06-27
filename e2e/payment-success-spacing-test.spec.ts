import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_EVENT_ID = 'da1f5918-20d9-4e90-81b2-3771e37051ce';

test.describe('Payment Success Card Spacing Iteration', () => {
  test('Iterate CSS changes to remove white space above payment success card', async ({ page }) => {
    console.log('🎯 Testing payment success card spacing...');
    
    // Navigate to event with payment success parameters
    const eventUrl = `${BASE_URL}/events/${TEST_EVENT_ID}?payment=success&payment_intent=test_12345`;
    await page.goto(eventUrl, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for payment success card to appear
    await page.waitForSelector('[data-test-id="payment-success-card"]', { timeout: 10000 });
    
    console.log('💳 Payment success card loaded, analyzing spacing...');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/spacing-iteration-initial.png',
      fullPage: false 
    });
    
    // Measure current spacing
    const initialMeasurements = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-test-id="event-sidebar"]');
      const sidebarContent = sidebar?.querySelector('.sticky');
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      const mainContent = document.querySelector('[data-test-id="event-detail-content"]');
      
      if (!sidebar || !sidebarContent || !paymentCard || !mainContent) {
        return { error: 'Elements not found' };
      }
      
      const sidebarRect = sidebar.getBoundingClientRect();
      const sidebarContentRect = sidebarContent.getBoundingClientRect();
      const cardRect = paymentCard.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      
      return {
        sidebarTop: sidebarRect.top,
        sidebarContentTop: sidebarContentRect.top,
        cardTop: cardRect.top,
        mainContentTop: mainRect.top,
        gapAboveCard: cardRect.top - sidebarContentRect.top,
        alignmentDiff: cardRect.top - mainRect.top,
        sidebarClasses: sidebarContent.className,
        currentSpacing: sidebarContentRect.top - sidebarRect.top
      };
    });
    
    console.log('📊 Initial measurements:', initialMeasurements);
    
    // Iteration 1: Remove top-24 sticky positioning
    console.log('\n🔄 Iteration 1: Removing sticky top-24...');
    await page.evaluate(() => {
      const sidebarContent = document.querySelector('[data-test-id="event-sidebar"] .sticky');
      if (sidebarContent) {
        sidebarContent.classList.remove('top-24');
        sidebarContent.classList.add('top-0');
      }
    });
    
    await page.waitForTimeout(1000);
    
    const iter1Measurements = await page.evaluate(() => {
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      const mainContent = document.querySelector('[data-test-id="event-detail-content"]');
      
      if (!paymentCard || !mainContent) return { error: 'Elements not found' };
      
      const cardRect = paymentCard.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      
      return {
        cardTop: cardRect.top,
        mainContentTop: mainRect.top,
        alignmentDiff: cardRect.top - mainRect.top
      };
    });
    
    console.log('📊 Iteration 1 measurements:', iter1Measurements);
    
    await page.screenshot({ 
      path: 'test-results/spacing-iteration-1.png',
      fullPage: false 
    });
    
    // Iteration 2: Remove space-y-6 from container
    console.log('\n🔄 Iteration 2: Removing space-y-6...');
    await page.evaluate(() => {
      const sidebarContent = document.querySelector('[data-test-id="event-sidebar"] .sticky');
      if (sidebarContent) {
        sidebarContent.classList.remove('space-y-6');
      }
    });
    
    await page.waitForTimeout(1000);
    
    const iter2Measurements = await page.evaluate(() => {
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      const mainContent = document.querySelector('[data-test-id="event-detail-content"]');
      
      if (!paymentCard || !mainContent) return { error: 'Elements not found' };
      
      const cardRect = paymentCard.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      
      return {
        cardTop: cardRect.top,
        mainContentTop: mainRect.top,
        alignmentDiff: cardRect.top - mainRect.top
      };
    });
    
    console.log('📊 Iteration 2 measurements:', iter2Measurements);
    
    await page.screenshot({ 
      path: 'test-results/spacing-iteration-2.png',
      fullPage: false 
    });
    
    // Iteration 3: Add negative margin to payment card
    console.log('\n🔄 Iteration 3: Adding negative margin to card...');
    await page.evaluate(() => {
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      if (paymentCard) {
        (paymentCard as HTMLElement).style.marginTop = '-6rem';
      }
    });
    
    await page.waitForTimeout(1000);
    
    const iter3Measurements = await page.evaluate(() => {
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      const mainContent = document.querySelector('[data-test-id="event-detail-content"]');
      
      if (!paymentCard || !mainContent) return { error: 'Elements not found' };
      
      const cardRect = paymentCard.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      
      return {
        cardTop: cardRect.top,
        mainContentTop: mainRect.top,
        alignmentDiff: cardRect.top - mainRect.top
      };
    });
    
    console.log('📊 Iteration 3 measurements:', iter3Measurements);
    
    await page.screenshot({ 
      path: 'test-results/spacing-iteration-3.png',
      fullPage: false 
    });
    
    // Iteration 4: Try different negative margin value
    console.log('\n🔄 Iteration 4: Adjusting negative margin...');
    await page.evaluate(() => {
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      if (paymentCard) {
        (paymentCard as HTMLElement).style.marginTop = '-8rem';
      }
    });
    
    await page.waitForTimeout(1000);
    
    const iter4Measurements = await page.evaluate(() => {
      const paymentCard = document.querySelector('[data-test-id="payment-success-card"]');
      const mainContent = document.querySelector('[data-test-id="event-detail-content"]');
      
      if (!paymentCard || !mainContent) return { error: 'Elements not found' };
      
      const cardRect = paymentCard.getBoundingClientRect();
      const mainRect = mainContent.getBoundingClientRect();
      
      return {
        cardTop: cardRect.top,
        mainContentTop: mainRect.top,
        alignmentDiff: cardRect.top - mainRect.top,
        perfectAlignment: Math.abs(cardRect.top - mainRect.top) < 10
      };
    });
    
    console.log('📊 Iteration 4 measurements:', iter4Measurements);
    
    await page.screenshot({ 
      path: 'test-results/spacing-iteration-4-final.png',
      fullPage: false 
    });
    
    // Determine best solution
    const solutions = [
      { name: 'Initial', alignment: (initialMeasurements as any).alignmentDiff },
      { name: 'Remove top-24', alignment: (iter1Measurements as any).alignmentDiff },
      { name: 'Remove space-y-6', alignment: (iter2Measurements as any).alignmentDiff },
      { name: 'Negative margin -6rem', alignment: (iter3Measurements as any).alignmentDiff },
      { name: 'Negative margin -8rem', alignment: (iter4Measurements as any).alignmentDiff }
    ];
    
    const bestSolution = solutions.reduce((best, current) => 
      Math.abs(current.alignment) < Math.abs(best.alignment) ? current : best
    );
    
    console.log('\n🏆 BEST SOLUTION:', bestSolution);
    console.log('📊 All solutions:', solutions);
    
    // Apply the best solution if it's good enough
    if (Math.abs(bestSolution.alignment) < 20) {
      console.log('✅ Good alignment found! Applying solution...');
      
      if (bestSolution.name.includes('negative margin')) {
        const marginValue = bestSolution.name.includes('-8rem') ? '-8rem' : '-6rem';
        console.log(`💡 Recommended CSS: Add className="-mt-32" or "-mt-24" to payment success card`);
        console.log(`💡 Or use inline style: marginTop: "${marginValue}"`);
      } else if (bestSolution.name.includes('top-24')) {
        console.log('💡 Recommended: Remove top-24 from sticky container');
      } else if (bestSolution.name.includes('space-y-6')) {
        console.log('💡 Recommended: Remove space-y-6 from sticky container');
      }
    }
    
    expect(true).toBe(true); // Test always passes, this is for iteration
  });
});