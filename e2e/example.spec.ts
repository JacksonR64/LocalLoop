import { test, expect } from '@playwright/test';

test('homepage loads basic structure', async ({ page }) => {
  await page.goto('/');

  // Wait for page to load properly
  await page.waitForLoadState('domcontentloaded');

  // Check that the basic page structure is present using data-test-id
  await expect(page.locator('[data-test-id="homepage-header"]')).toBeVisible();
  await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();
  await expect(page.locator('[data-test-id="main-content"]')).toBeVisible();

  // Check that LocalLoop branding is visible
  await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
  await expect(page.locator('[data-test-id="homepage-title"]')).toHaveText('LocalLoop');

  // Check hero section content
  await expect(page.locator('[data-test-id="hero-title"]')).toBeVisible();
  await expect(page.locator('[data-test-id="hero-title"]')).toHaveText('Discover Local Events');

  await expect(page.locator('[data-test-id="hero-description"]')).toBeVisible();

  // Check footer (always visible)
  await expect(page.locator('[data-test-id="homepage-footer"]')).toBeVisible();
  await expect(page.locator('[data-test-id="footer-title"]')).toHaveText('LocalLoop');

  console.log('Homepage basic structure loaded successfully');
});

test('navigation elements are present', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for essential elements to be ready
  await expect(page.locator('[data-test-id="homepage-header"]')).toBeVisible();

  // Check navigation elements (viewport-aware)
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;

  if (isMobile) {
    // On mobile, desktop nav should be hidden and mobile menu button visible
    await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeHidden();
  } else {
    // On desktop, desktop nav should be visible
    await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeVisible();
    await expect(page.locator('[data-test-id="browse-events-button"]')).toBeVisible();
    
    // Create event link is only visible for staff/admin users
    // Check if it exists, but don't require it since it depends on user role
    const createEventLink = page.locator('[data-test-id="create-event-link"]');
    const createEventLinkExists = await createEventLink.count() > 0;
    if (createEventLinkExists) {
      await expect(createEventLink).toBeVisible();
    }
  }

  console.log('Navigation elements are present and responsive');
});

test('basic responsive layout works', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for essential elements to be ready
  await expect(page.locator('[data-test-id="homepage-header"]')).toBeVisible();

  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500); // Allow layout to settle

  // Check that mobile menu button is visible on mobile
  await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeVisible();

  // Check that desktop nav is hidden on mobile
  await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeHidden();

  // Check that main content still exists
  await expect(page.locator('[data-test-id="main-content"]')).toBeVisible();
  await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();

  // Test desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500); // Allow layout to settle

  // Check that desktop navigation is visible
  await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeVisible();

  // Mobile menu button should be hidden on desktop
  await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeHidden();

  // Check that main content is still visible
  await expect(page.locator('[data-test-id="hero-title"]')).toBeVisible();

  console.log('Basic responsive layout works correctly');
});
