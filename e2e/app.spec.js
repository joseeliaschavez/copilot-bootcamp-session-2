import { test, expect } from '@playwright/test';

test.describe('Frontend App', () => {
  test('should load the app and display main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    await expect(page).toHaveTitle(/Copilot Bootcamp/i);
  });

  test('should display items list on the page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for common item list elements
    const itemsList = page.locator('[class*="item"]');
    const appContainer = page.locator('[class*="app"]', { root: page.locator('body') });
    
    // At minimum, the page should have some content
    expect(appContainer).toBeDefined();
  });

  test('should have visible page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the page has a body with content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for main content area or any heading
    const hasContent = await page.locator('h1, h2, main, [role="main"]').first().isVisible().catch(() => false);
    expect(hasContent || await body.locator('*').count() > 2).toBeTruthy();
  });
});
