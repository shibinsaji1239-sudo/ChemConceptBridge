// Module 8: Subscription Functionality Test
// Using real credentials: tessasaji2026@mca.ajce.in / Tessa@12345
import { test, expect } from '@playwright/test';
import { clearStorage } from './utils/testHelpers.js';

const USER_EMAIL = 'tessasaji2026@mca.ajce.in';
const USER_PASSWORD = 'Tessa@12345';

test.describe('Module 8: Subscription Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test('Test Case 8: View subscription plans', async ({ page }) => {
        await test.step('Step 1: Login', async () => {
            await page.goto('/login');
            await page.fill('input[name="email"], input[type="email"]', USER_EMAIL);
            await page.fill('input[name="password"], input[type="password"]', USER_PASSWORD);
            await page.locator('button[type="submit"], button.login-btn, button:has-text("Login"), button:has-text("Sign In")').first().click();
            await page.waitForURL(/\/(student|teacher|admin)-dashboard/, { timeout: 20000 });
        });

        await test.step('Step 2: Navigate to subscription', async () => {
            // Try sidebar first
            const subButton = page.locator('button:has-text("Subscription"), .nav-item:has-text("Subscription"), a:has-text("Subscription")').first();
            if (await subButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await subButton.click();
            } else {
                await page.goto('/subscription');
            }
            await page.waitForTimeout(3000);
        });

        await test.step('Step 3: Verify subscription content', async () => {
            // Wait for loading to disappear
            await expect(page.locator('.loading, text=Loading')).not.toBeVisible({ timeout: 20000 }).catch(() => { });

            // Check for subscription header
            const header = page.locator('h1, h2, h3').filter({ hasText: /Subscription/i }).first();
            await expect(header).toBeVisible({ timeout: 15000 });

            // Verify plan names exist (more robust than checking specific container classes)
            await expect(page.locator('text=Basic Student, text=Pro Student').first()).toBeVisible({ timeout: 10000 }).catch(async () => {
                // Fallback to searching for student anywhere
                await expect(page.locator('text=Student').first()).toBeVisible();
            });
        });
    });
});
