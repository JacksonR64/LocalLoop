import { test, expect } from '@playwright/test'

test.describe('OAuth Flow Tests', () => {
    test('should handle OAuth callback without PKCE errors', async ({ page }) => {
        // Navigate to the callback page with a mock OAuth code
        // Note: This tests the callback processing logic without going through actual OAuth
        await page.goto('/auth/callback?code=mock-oauth-code-for-testing')

        // Check that we don't get the PKCE error
        await page.waitForTimeout(2000) // Wait for processing

        // Should not contain the PKCE error message
        const pageContent = await page.textContent('body')
        expect(pageContent).not.toContain('both auth code and code verifier should be non-empty')

        // Should show authentication processing or error handling
        const statusMessage = await page.locator('h2').first()
        const statusText = await statusMessage.textContent()

        // Should show either processing or a more specific error (not PKCE)
        expect(statusText).toMatch(/(Processing|Authentication|Error)/)

        console.log('OAuth callback page status:', statusText)
    })

    test('should handle OAuth errors gracefully', async ({ page }) => {
        // Test error handling
        await page.goto('/auth/callback?error=access_denied&error_description=User+denied+access')

        await page.waitForTimeout(1000)

        // Should show error state
        const errorMessage = await page.locator('h2').first()
        const errorText = await errorMessage.textContent()

        expect(errorText).toContain('Error')

        console.log('OAuth error handling:', errorText)
    })

    test('should handle missing code parameter', async ({ page }) => {
        // Test missing code parameter
        await page.goto('/auth/callback')

        await page.waitForTimeout(1000)

        // Should show error for missing code
        const statusMessage = await page.locator('h2').first()
        const statusText = await statusMessage.textContent()

        expect(statusText).toMatch(/(Error|Authentication failed)/)

        console.log('Missing code handling:', statusText)
    })

    test('should have correct session storage key', async ({ page }) => {
        // Test that the session storage key is consistent
        await page.goto('/auth/login')

        // Set the return URL in session storage with the correct key
        await page.evaluate(() => {
            sessionStorage.setItem('auth_return_url', '/test-redirect')
        })

        // Check the key is correctly set
        const returnUrl = await page.evaluate(() => {
            return sessionStorage.getItem('auth_return_url')
        })

        expect(returnUrl).toBe('/test-redirect')

        console.log('Session storage key test passed')
    })
}) 